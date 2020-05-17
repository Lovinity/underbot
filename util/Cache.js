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
        // TODO: Temporary black hole for model lifecycles
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
                this.query(queued[ 0 ], queued[ 1 ]);
            });
        });
    }

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
     */
    find (values) {
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
        } else {
            return this.create(values, () => {
                return criteria;
            })
        }
    }

    /**
     * Query the cache
     * 
     * @param {array} values Array of values for uniqueFields to determine which record(s) to edit.
     * @param {function} criteria Function that returns a dictionary of key:value pairs either to use as a new record or to change an existing one.
     */
    set (values, criteria) {
        // If the cache container was not yet intiialized, queue this for later when it is initialized.
        if (!this.initialized) {
            this.queued.push([ values, criteria ]);
        } else {

            // Record found? Update it.
            var record = this.collection.find((record) => this.filterByUnique(record, values) && !isNaN(record.id));
            if (record) {

                // Update cache first
                var orm = criteria();
                var tempRecord = _.cloneDeep(record);

                // Do not proceed if changes do not actually change anything
                if (_.isEqual(record, Object.assign(tempRecord, orm))) {
                    console.log(`Bailing; equal.`);
                    return;
                }

                delete orm.id;
                orm.updatedAt = moment().valueOf();
                Object.assign(record, orm);

                this.collection.set(record.id, record);

                // Update database in the background
                sails.models[ this.model ].update({ id: record.id }, _.cloneDeep(orm)).fetch().exec(() => { });
            } else {
                this.create(values, criteria);
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

        sails.models[ this.model ].destroy({ id }).fetch().exec(() => { });
    }

    /**
     * Create a new record in the cache and database
     * 
     * @param {object} orm Already-resolved object of criteria
     */
    create (values, criteria) {
        // Create a temporary record in the cache, or update existing one
        var updating = false;
        var orm = criteria();
        var key = this.generateKeyByFields(values);
        orm.id = key;
        orm.updatedAt = moment().valueOf();

        var tempRecord = this.collection.get(key);
        // Do not proceed if changes do not actually change anything
        if (tempRecord && _.isEqual(tempRecord, Object.assign(tempRecord, orm))) {
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
                }
            });
        }

        return this.collection.get(key);
    }

    filterByUnique (record, values) {
        var match = true;
        this.uniqueFields.forEach((field, index) => {
            if (!record[ field ] || record[ field ] !== values[ index ]) {
                match = false;
            }
        })
        return match;
    }

    generateKeyByFields (values) {
        var returnString = `F_`;
        this.uniqueFields.forEach((field, index) => {
            if (values[ index ]) {
                returnString += `${values[ index ]}_`
            }
        });
        return returnString;
    }

    generateCriteriaByFields (values) {
        var criteria = {};
        this.uniqueFields.forEach((field, index) => {
            criteria[ field ] = values[ index ];
        })
        return criteria;
    }
}

// Sync helper for developing and returning a default record when creating a new one in the database. 
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