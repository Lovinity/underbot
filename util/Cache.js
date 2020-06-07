/**
 *  Class that holds and manages each cache container
 */
class CacheManager {
    constructor() {
        this.containers = new Discord.Collection();
    }

    /**
     * Create a new container
     * 
     * @param {string} model Name of the sails.js model to cache
     * @param {array} uniqueFields Array of column names used to determine if a record is unique (unique unless ALL fields are the same between rows)
     */
    new (model, uniqueFields) {
        if (this.containers.has(model)) return;
        this.containers.set(model, new CacheContainer(model, uniqueFields));
    }

    /**
     * Get the container of the provided cache model.
     * 
     * @param {string} model Name of model
     */
    get (model) {
        if (!this.containers.has(model)) return;
        return this.containers.get(model);
    }

    set (model, record) {
        // TODO: Temporary black hole for model lifecycles. Find a way to compare what is passed here with the cache and determine if the cache should be updated with this.
    }
}

class CacheContainer {

    /**
     * Create a cache container
     * NOTE: When you set uniqueFields, every find, set, and create call MUST include values for those keys.
     * 
     * @param {string} model Name of the sails.js model to cache
     * @param {array} uniqueFields Array of column names used to determine if a record is unique and to find a record (unique unless ALL fields are the same between rows)
     */
    constructor(model, uniqueFields) {
        this.collection = new Discord.Collection();
        this.queued = [];
        this.sync = [];

        this.model = model;
        this.uniqueFields = uniqueFields;

        this.initialized = false;

        // Initialize the cache by loading what is currently in the database. Execute the queue once loaded.
        sails.models[ this.model ].find().then((results) => {
            results.forEach((result) => {
                this.collection.set(result.id, result);
            });
            this.initialized = true;
            this.queued.forEach((queued) => {
                this.set(queued[ 0 ], queued[ 1 ]);
            });
        });
    }

    // Get a cache record by its key/ID
    get (key) {
        if (this.cache.has(key)) {
            const value = this.cache.get(key);
            if (value) {
                return value;
            }
        }
        return null;
    }

    /**
     * Find a record matching the provided values, or create one if it does not exist.
     * 
     * @param {array} values Array of values corresponding to the uniqueFields array.
     * @param {?boolean} create Whether or not to create a new record with default values if one was not found (default: true).
     * @return {?object} The record, or null if it does not exist and create was false.
     */
    find (values, create = true) {
        var criteria = {};
        var record = this.collection.find((rec) => {
            var found = true;
            this.uniqueFields.forEach((field, index) => {
                criteria[ field ] = values[ index ];
                if (rec[ field ] !== values[ index ]) {
                    found = false;
                }
            });
            return found;
        });

        if (record) {
            return record;
        } else if (create) {
            return this._create(values, () => {
                return criteria;
            })
        } else {
            return null;
        }
    }

    /**
     * Query the cache
     * 
     * @param {array} values Array of values for uniqueFields to determine which record(s) to edit.
     * @param {function} criteria Function that returns a dictionary of key:value pairs either to use as a new record or to change an existing one.
     */
    set (values, criteria) {
        sails.log.debug(`Set on ${this.model} of ${JSON.stringify(values)}`);
        // If the cache container was not yet initialized, queue this for later when it is initialized.
        if (!this.initialized) {
            this.queued.push([ values, criteria ]);
        } else {

            // Record found? Update it. Otherwise, create it.
            var record = this.collection.find((record) => this.filterByUnique(record, values) && !isNaN(record.id));
            if (record) {

                // Update cache first
                var orm = criteria();
                var tempRecord = _.cloneDeep(record);

                // Do not proceed if changes do not actually change anything
                if (_.isEqual(record, Object.assign(tempRecord, orm))) {
                    sails.log.debug(`Bailing: equal`)
                    return;
                }

                delete orm.id;
                orm.updatedAt = moment().valueOf();
                Object.assign(record, orm);

                this.collection.set(record.id, record);

                var orm2 = _.cloneDeep(orm);

                // Update database in the background
                sails.models[ this.model ].update({ id: record.id }, orm2).fetch().exec((err) => {
                    if (err)
                        sails.helpers.events.error(err).exec(() => { });
                });
            } else {
                this._create(values, criteria);
            }
        }
    }

    /**
     * Delete a record from cache and the database
     * 
     * @param {number} id ID of the record to delete
     */
    delete (id) {
        // Delete from cache before deleting from database
        this.collection.delete(id);

        sails.models[ this.model ].destroy({ id }).fetch().exec((err) => {
            if (err)
                sails.helpers.events.error(err).exec(() => { });
        });
    }

    /**
     * Create a new record in the cache and database.
     * NOTE: Not recommended to call this directly (you might end up with duplicate primary keys); use set or find instead.
     * 
     * @param {object} orm Already-resolved object of criteria
     */
    _create (values, criteria) {
        sails.log.debug(`_create on ${this.model} of ${JSON.stringify(values)}`);
        // Cache first, database second. Update/create record in the cache.
        var updating = false;
        var orm = criteria();
        var key = this.generateKeyByFields(values);
        orm.id = key;
        orm.updatedAt = moment().valueOf();

        var tempRecord = this.collection.get(key);

        // Do not proceed if changes do not actually change anything
        if (tempRecord && _.isEqual(tempRecord, Object.assign(tempRecord, orm))) {
            sails.log.debug(`Bailing; equal`);
            return;
        }

        if (tempRecord) {
            updating = true;
            Object.assign(tempRecord, orm);
            this.collection.set(key, tempRecord);
        } else {
            Object.assign(orm, this.generateCriteriaByFields(values));
            tempRecord = makeDefault(sails.models[ this.model ].attributes, orm);
            this.collection.set(key, tempRecord);
        }

        // Determine if we already queued for a create. If so, add a queue for an update after the create. Otherwise create.
        if (updating) {
            this.sync.push(key);
        } else {
            delete tempRecord.id;
            sails.models[ this.model ].create(_.cloneDeep(tempRecord)).fetch().exec((err, recordx) => {
                if (!err) {
                    // Change key from temporary to permanent one, but maintain data in cache instead of database.
                    var tempRecord2 = this.collection.get(key);
                    this.collection.delete(key);
                    this.collection.set(recordx.id, Object.assign(tempRecord2, { id: recordx.id }));

                    // Execute an update if we are pending an additional sync triggered after the original create.
                    this.sync
                        .filter((sync) => sync === key)
                        .map((sync) => {
                            var updater = this.collection.get(key);
                            delete updater.id;
                            delete updater.updatedAt;
                            sails.models[ this.model ].update({ id: recordx.id }, updater).fetch().exec(() => { });
                        })
                    this.sync = this.sync.filter((sync) => sync !== key)
                } else {
                    console.error(err);
                    sails.helpers.events.error(err).exec(() => { });
                }
            });
        }

        return this.collection.get(key);
    }

    /**
     * Filter function to filter records by the unique field values.
     * 
     * @param {object} record The database/cache record.
     * @param {object} values The unique fields key:value to filter down to
     * @returns {boolean} False if the record's values do not match the provided values, otherwise true.
     */
    filterByUnique (record, values) {
        var match = true;
        this.uniqueFields.forEach((field, index) => {
            if (!record[ field ] || record[ field ] !== values[ index ]) {
                match = false;
            }
        })
        return match;
    }

    /**
     * Generate a temporary key/ID for a cache entry before it gets added to the database.
     * 
     * @param {object} values key:value entries for the uniqueFields of the record.
     * @returns {string} The temporary key based on the uniqueFields with an F_ prefix (to indicate it is temporary).
     */
    generateKeyByFields (values) {
        var returnString = `F_`;
        this.uniqueFields.forEach((field, index) => {
            if (values[ index ]) {
                returnString += `${values[ index ]}_`
            }
        });
        return returnString;
    }

    /**
     * Generate a criteria dictionary based on unique field values.
     * 
     * @param {object} values key:value pairs of the fields.
     * @returns {object} criteria
     */
    generateCriteriaByFields (values) {
        var criteria = {};
        this.uniqueFields.forEach((field, index) => {
            criteria[ field ] = values[ index ];
        })
        return criteria;
    }
}

/**
 * Construct a default new record for the cache before it gets added to the database.
 * 
 * @param {object} attributes Sails.js model.attributes template
 * @param {object} defaults key:value pairs of default values to use
 * @returns {object} The record to add to the cache
 */
function makeDefault (attributes, defaults = {}) {
    var temp = {};
    for (var key in attributes) {
        if (Object.prototype.hasOwnProperty.call(attributes, key)) {
            temp[ key ] = (typeof defaults[ key ] !== 'undefined') ? (defaults[ key ]) : (typeof attributes[ key ].defaultsTo !== 'undefined') ? attributes[ key ].defaultsTo : (attributes[ key ].autoCreatedAt || attributes[ key ].autoUpdatedAt ? undefined : null);
        }
    }
    return temp;
}

module.exports = CacheManager;