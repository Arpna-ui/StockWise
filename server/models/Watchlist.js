import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Watchlist must belong to a user'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Watchlist name is required'],
      trim: true,
      maxlength: [50, 'Watchlist name cannot exceed 50 characters'],
    },
    stocks: [
      {
        type: String,
        uppercase: true,
        trim: true,
      },
    ],
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

watchlistSchema.index({ user: 1, name: 1 });

export const MongooseWatchlistModel = mongoose.model('Watchlist', watchlistSchema);

// In-Memory Dev Store
const inMemoryWatchlists = [];

class HybridWatchlistRepository {
  get isMongoActive() {
    return mongoose.connection.readyState === 1;
  }

  find(query = {}) {
    if (this.isMongoActive) {
      return MongooseWatchlistModel.find(query);
    }

    const execute = () => {
      return inMemoryWatchlists.filter((w) => {
        if (query.user && w.user.toString() !== query.user.toString()) return false;
        return true;
      });
    };

    return {
      sort: function () {
        return this;
      },
      then: function (resolve, reject) {
        try {
          resolve(execute());
        } catch (err) {
          reject(err);
        }
      },
      catch: function (reject) {
        return this.then(null, reject);
      },
    };
  }

  findOne(query) {
    if (this.isMongoActive) {
      return MongooseWatchlistModel.findOne(query);
    }

    const execute = () => {
      const match = inMemoryWatchlists.find((w) => {
        if (query.user && w.user.toString() !== query.user.toString()) return false;
        if (query._id && w._id.toString() !== query._id.toString()) return false;
        if (query.name && w.name.toLowerCase() !== query.name.toLowerCase()) return false;
        return true;
      });

      if (!match) return null;

      return {
        ...match,
        save: async function () {
          const idx = inMemoryWatchlists.findIndex((x) => x._id === this._id);
          if (idx !== -1) inMemoryWatchlists[idx] = this;
          return this;
        },
        deleteOne: async function () {
          const idx = inMemoryWatchlists.findIndex((x) => x._id === this._id);
          if (idx !== -1) inMemoryWatchlists.splice(idx, 1);
          return { deletedCount: 1 };
        },
      };
    };

    return {
      then: function (resolve, reject) {
        try {
          resolve(execute());
        } catch (err) {
          reject(err);
        }
      },
      catch: function (reject) {
        return this.then(null, reject);
      },
    };
  }

  findById(id) {
    if (this.isMongoActive) {
      return MongooseWatchlistModel.findById(id);
    }

    const execute = () => {
      const match = inMemoryWatchlists.find((w) => w._id.toString() === id.toString());
      if (!match) return null;

      return {
        ...match,
        save: async function () {
          const idx = inMemoryWatchlists.findIndex((x) => x._id === this._id);
          if (idx !== -1) inMemoryWatchlists[idx] = this;
          return this;
        },
        deleteOne: async function () {
          const idx = inMemoryWatchlists.findIndex((x) => x._id === this._id);
          if (idx !== -1) inMemoryWatchlists.splice(idx, 1);
          return { deletedCount: 1 };
        },
      };
    };

    return {
      then: function (resolve, reject) {
        try {
          resolve(execute());
        } catch (err) {
          reject(err);
        }
      },
      catch: function (reject) {
        return this.then(null, reject);
      },
    };
  }

  async findByIdAndDelete(id) {
    if (this.isMongoActive) {
      return await MongooseWatchlistModel.findByIdAndDelete(id);
    }
    const idx = inMemoryWatchlists.findIndex((w) => w._id.toString() === id.toString());
    if (idx !== -1) {
      return inMemoryWatchlists.splice(idx, 1)[0];
    }
    return null;
  }

  async create(data) {
    if (this.isMongoActive) {
      return await MongooseWatchlistModel.create(data);
    }

    const newWl = {
      _id: `wl_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      user: data.user,
      name: data.name,
      stocks: Array.isArray(data.stocks) ? data.stocks.map((s) => s.toUpperCase()) : [],
      isDefault: Boolean(data.isDefault),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    inMemoryWatchlists.push(newWl);
    return newWl;
  }
}

export const Watchlist = new HybridWatchlistRepository();
