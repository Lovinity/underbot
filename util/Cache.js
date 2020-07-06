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
    async new (model, uniqueFields) {
        if (this.containers.has(model)) return;
        var cacheContainer = new CacheContainer(model, uniqueFields);
        this.containers.set(model, cacheContainer);
        await cacheContainer.init();
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
        this.dbQueue = [];

        this.model = model;
        this.uniqueFields = uniqueFields;

        this.initialized = false;
        this.running = false;
    }

    async init () {
        // Initialize the cache by loading what is currently in the database. Execute the queue once loaded.
        sails.log.verbose(`${this.model}: Initializing...`);
        var results = await sails.models[ this.model ].find();
        results.forEach((result) => {
            this.collection.set(result.id, result);
        });
        this.initialized = true;
        sails.log.verbose(`${this.model}: Initialized`);
    }

    // Get a cache record by its key/ID
    get (key) {
        if (this.collection.has(key)) {
            const value = this.collection.get(key);
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
        if (!this.initialized)
            throw new Error('Model is not yet initialized.');
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
            return this._create(values, criteria);
        } else {
            return null;
        }
    }

    /**
     * Query the cache
     * 
     * @param {array} values Array of values for uniqueFields to determine which record(s) to edit.
     * @param {object} criteria Object of key:value pairs to update to (or create with).
     */
    set (values, criteria) {
        sails.log.verbose(`${this.model}=>set(${JSON.stringify(values)}): set called (${JSON.stringify(criteria)})`);
        // If the cache container was not yet initialized, queue this for later when it is initialized.
        if (!this.initialized) {
            throw new Error("Model not initialized");
        } else {
            // Record found? Update it. Otherwise, create it.
            var record = this.collection.find((record) => this.filterByUnique(record, values) && !isNaN(record.id));
            if (record) {
                sails.log.verbose(`${this.model}=>set(${JSON.stringify(values)}): Record found. Updating cache.`);

                // Update cache first
                var tempRecord = _.cloneDeep(record);

                delete criteria.id; // Don't want to update cache with id
                criteria.updatedAt = moment().valueOf();
                Object.assign(record, criteria);

                this.collection.set(record.id, record);

                this.queueSync(record.id);
            } else {
                sails.log.verbose(`${this.model}=>set(${JSON.stringify(values)}): Record not found.`);
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
        sails.log.verbose(`${this.model}=>delete(${id}): Called.`);
        // Delete from cache before deleting from database
        sails.log.verbose(`${this.model}=>delete(${id}): Deleting record from cache.`);
        this.collection.delete(id);

        this.queueSync(id);
    }

    /**
     * Create a new record in the cache and database.
     * NOTE: Not recommended to call this directly (you might end up with duplicate primary keys); use set or find instead.
     * 
     * @param {array} values Array of values for uniqueFields to determine if a record was already created but not in the db yet.
     * @param {object} criteria Object of key:value pairs; must pass all required fields!
     */
    _create (values, criteria) {
        sails.log.verbose(`${this.model}=>_create(${JSON.stringify(values)}): Called.`);

        // Cache first, database second. Update/create record in the cache.
        var key = this.generateKeyByFields(values);
        criteria.id = key;
        criteria.updatedAt = moment().valueOf();

        sails.log.verbose(`${this.model}=>_create(${JSON.stringify(values)}): Temp ID is ${key}.`);

        var tempRecord = this.collection.get(key);

        sails.log.verbose(`${this.model}=>_create(${key}): Updating cache.`);

        if (tempRecord) {
            Object.assign(tempRecord, criteria);
            this.collection.set(key, tempRecord);
        } else {
            Object.assign(criteria, this.generateCriteriaByFields(values));
            tempRecord = makeDefault(sails.models[ this.model ].attributes, criteria);
            this.collection.set(key, tempRecord);
        }

        this.queueSync(key);

        return this.collection.get(key);
    }

    /**
     * Queue a record sync to DB.
     * 
     * @param {string|number} key The record key to sync to DB.
     */
    queueSync (key) {
        // Queue a sync
        sails.log.verbose(`${this.model}=>queueSync(${key}): Called.`);
        if (!this.running) {
            sails.log.verbose(`${this.model}=>queueSync(${key}): Syncing DB.`);
            this.running = true;
            this._sync(key);
        } else {
            if (this.dbQueue.indexOf(key) !== -1) {
                sails.log.verbose(`${this.model}=>queueSync(${key}): DB operations running, but this record is already queued for sync.`);
            } else {
                sails.log.verbose(`${this.model}=>queueSync(${key}): DB operations running; queued sync.`);
                this.dbQueue.push(key);
            }
        }
    }

    /**
     * Process an operation in the actual database.
     * NOTE: Should not be called directly; use queueSync instead.
     * 
     * @param {string|number} key The id of the record to sync.
     */
    _sync (key) {
        sails.log.verbose(`${this.model}=>_sync(${key}): Called.`);
        var nextTask = () => {
            sails.log.verbose(`${this.model}=>_sync(${key})=>nextTask(): Called.`);
            if (this.dbQueue.length > 0) {
                var nextInLine = this.dbQueue.shift();
                this._sync(nextInLine);
            } else {
                sails.log.verbose(`${this.model}=>_sync(${key})=>nextTask(): Nothing more to do; DB operations finished.`);
                this.running = false;
            }
        };

        // Change temporary id to permanent one if we can, else delete it
        if (key && isNaN(key) && key.startsWith("F_")) {
            var record = this.collection.find((record) => key === this.generateKeyByFields(record));
            if (record) {
                sails.log.verbose(`${this.model}=>_sync(${key}): Real id found: ${record.id}.`);
                key = record.id;
            } else {
                sails.log.verbose(`${this.model}=>_sync(${JSON.stringify(values)}): Real id NOT found.`);
            }
        }

        // Determine action
        var record = this.collection.get(key);
        var action;
        if (!record) {
            action = 'destroy';
        } else if (record && isNaN(key) && key.startsWith("F_")) {
            action = 'create';
        } else {
            action = 'update';
        }

        // Do stuff
        if (record) {
            var criteria = _.cloneDeep(record);
            delete criteria.id;
        }
        switch (action) {
            case 'create':
                sails.log.verbose(`${this.model}=>_sync(${key}): Creating DB record.`);
                sails.models[ this.model ].create(criteria).fetch().exec((err, recordx) => {
                    if (!err) {
                        sails.log.verbose(`${this.model}=>_sync(${key}): Created.`);

                        // Change key from temporary to permanent one, but maintain data in cache instead of database.
                        this.collection.delete(key);
                        this.collection.set(recordx.id, Object.assign(record, { id: recordx.id }));
                        sails.log.verbose(`${this.model}=>_sync(${key}): Updated cache temp id to permanent id ${recordx.id}.`);
                    } else {
                        sails.log.verbose(`${this.model}=>_sync(${key}): Create ERROR.`);
                        sails.helpers.events.error(err).exec(() => { });
                    }
                    nextTask();
                });
                break;
            case 'update':
                sails.log.verbose(`${this.model}=>_sync(${key}): Updating DB record.`);
                sails.models[ this.model ].update({ id: key }, criteria).fetch().exec((err) => {
                    if (err) {
                        sails.helpers.events.error(err).exec(() => { });
                        sails.log.verbose(`${this.model}=>_sync(${key}): Update ERROR.`);
                    } else {
                        sails.log.verbose(`${this.model}=>_sync(${key}): Updated.`);
                    }
                    nextTask();
                });
                break;
            case 'destroy':
                sails.log.verbose(`${this.model}=>_sync(${key}): Destroying DB record.`);
                sails.models[ this.model ].destroy({ id: key }).fetch().exec((err) => {
                    if (err) {
                        sails.helpers.events.error(err).exec(() => { });
                        sails.log.verbose(`${this.model}=>_sync(${key}): destroy ERROR.`);
                    } else {
                        sails.log.verbose(`${this.model}=>_sync(${key}): Destroyed.`);
                    }
                    nextTask();
                });
                break;
        }
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
     * @param {array|object} values Array of entries, or object of key:value pairs, for the uniqueFields of the record.
     * @returns {string} The temporary key based on the uniqueFields with an F_ prefix (to indicate it is temporary).
     */
    generateKeyByFields (values) {
        var returnString = `F_`;
        this.uniqueFields.forEach((field, index) => {
            if (values.constructor === Array && values[ index ]) {
                returnString += `${values[ index ]}_`
            } else if (values[ field ]) {
                returnString += `${values[ field ]}_`
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