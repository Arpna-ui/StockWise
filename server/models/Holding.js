import mongoose from 'mongoose';

const holdingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Holding must be associated with a user'],
      index: true,
    },
    portfolio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portfolio',
      required: [true, 'Holding must belong to a portfolio'],
    },
    stock: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stock',
    },
    symbol: {
      type: String,
      required: [true, 'Stock symbol is required'],
      uppercase: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    sector: {
      type: String,
      trim: true,
      default: 'General Equities',
    },
    shares: {
      type: Number,
      required: [true, 'Number of shares is required'],
      min: [0, 'Shares quantity cannot be negative'],
    },
    averageBuyPrice: {
      type: Number,
      required: [true, 'Average buy price is required'],
      min: [0, 'Average buy price cannot be negative'],
    },
    totalInvested: {
      type: Number,
      default: 0.00,
    },
    currentPrice: {
      type: Number,
      default: 0.00,
    },
    currentValue: {
      type: Number,
      default: 0.00,
    },
    unrealizedPnL: {
      type: Number,
      default: 0.00,
    },
    pnlPercent: {
      type: Number,
      default: 0.00,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee one holding document per user per stock
holdingSchema.index({ user: 1, symbol: 1 }, { unique: true });

export const MongooseHoldingModel = mongoose.model('Holding', holdingSchema);

// In-Memory Dev Store
const inMemoryHoldings = [];

/**
 * Wraps an in-memory holding document with instance methods (.save, .deleteOne)
 */
const wrapHolding = (h) => {
  if (!h) return null;
  return {
    ...h,
    save: async function () {
      if (this.shares < 0) {
        throw new Error('Holding shares cannot be negative.');
      }
      const idx = inMemoryHoldings.findIndex((x) => x._id === this._id);
      if (idx !== -1) {
        inMemoryHoldings[idx] = { ...this, updatedAt: new Date() };
      }
      return this;
    },
    deleteOne: async function () {
      const idx = inMemoryHoldings.findIndex((x) => x._id === this._id);
      if (idx !== -1) {
        inMemoryHoldings.splice(idx, 1);
      }
      return { acknowledged: true, deletedCount: 1 };
    },
  };
};

class HybridHoldingRepository {
  get isMongoActive() {
    return mongoose.connection.readyState === 1;
  }

  find(query = {}) {
    if (this.isMongoActive) {
      return MongooseHoldingModel.find(query);
    }

    const execute = () => {
      return inMemoryHoldings
        .filter((h) => {
          if (query.user && h.user.toString() !== query.user.toString()) return false;
          if (query.symbol && h.symbol !== query.symbol.toUpperCase()) return false;
          return true;
        })
        .map(wrapHolding);
    };

    return {
      populate: function () {
        return this;
      },
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
      return MongooseHoldingModel.findOne(query);
    }

    const execute = () => {
      const match = inMemoryHoldings.find((h) => {
        if (query.user && h.user.toString() !== query.user.toString()) return false;
        if (query.symbol && h.symbol !== query.symbol.toUpperCase()) return false;
        if (query._id && h._id.toString() !== query._id.toString()) return false;
        return true;
      });
      return wrapHolding(match);
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

  async create(data) {
    if (this.isMongoActive) {
      return await MongooseHoldingModel.create(data);
    }

    const newHolding = {
      _id: `hld_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      user: data.user,
      portfolio: data.portfolio,
      stock: data.stock,
      symbol: data.symbol.toUpperCase(),
      companyName: data.companyName,
      sector: data.sector || 'General Equities',
      shares: Number(data.shares),
      averageBuyPrice: Number(data.averageBuyPrice),
      totalInvested: Number(data.totalInvested || data.shares * data.averageBuyPrice),
      currentPrice: Number(data.currentPrice || data.averageBuyPrice),
      currentValue: Number(data.currentValue || data.shares * data.averageBuyPrice),
      unrealizedPnL: Number(data.unrealizedPnL || 0),
      pnlPercent: Number(data.pnlPercent || 0),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    inMemoryHoldings.push(newHolding);
    return wrapHolding(newHolding);
  }

  async deleteOne(query) {
    if (this.isMongoActive) {
      return await MongooseHoldingModel.deleteOne(query);
    }

    const idx = inMemoryHoldings.findIndex((h) => {
      if (query.user && h.user.toString() !== query.user.toString()) return false;
      if (query.symbol && h.symbol !== query.symbol.toUpperCase()) return false;
      if (query._id && h._id.toString() !== query._id.toString()) return false;
      return true;
    });

    if (idx !== -1) {
      inMemoryHoldings.splice(idx, 1);
      return { acknowledged: true, deletedCount: 1 };
    }

    return { acknowledged: true, deletedCount: 0 };
  }

  async deleteMany(query = {}) {
    if (this.isMongoActive) {
      return await MongooseHoldingModel.deleteMany(query);
    }

    let deleted = 0;
    for (let i = inMemoryHoldings.length - 1; i >= 0; i--) {
      const h = inMemoryHoldings[i];
      let matches = true;
      if (query.user && h.user.toString() !== query.user.toString()) matches = false;
      if (query.symbol && h.symbol !== query.symbol.toUpperCase()) matches = false;
      if (matches) {
        inMemoryHoldings.splice(i, 1);
        deleted++;
      }
    }
    return { acknowledged: true, deletedCount: deleted };
  }

  async countDocuments(query = {}) {
    if (this.isMongoActive) {
      return await MongooseHoldingModel.countDocuments(query);
    }
    return inMemoryHoldings.filter((h) => {
      if (query.user && h.user.toString() !== query.user.toString()) return false;
      if (query.symbol && h.symbol !== query.symbol.toUpperCase()) return false;
      return true;
    }).length;
  }
}

export const Holding = new HybridHoldingRepository();
