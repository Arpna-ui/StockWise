import mongoose from 'mongoose';

const portfolioSnapshotSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Portfolio snapshot must belong to a user'],
      index: true,
    },
    portfolio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portfolio',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    totalValue: {
      type: Number,
      required: true,
    },
    cashBalance: {
      type: Number,
      required: true,
    },
    investedAmount: {
      type: Number,
      required: true,
    },
    pnl: {
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

portfolioSnapshotSchema.index({ user: 1, date: -1 });

export const MongoosePortfolioSnapshotModel = mongoose.model(
  'PortfolioSnapshot',
  portfolioSnapshotSchema
);

// In-Memory Dev Store
const inMemorySnapshots = [];

class HybridSnapshotRepository {
  get isMongoActive() {
    return mongoose.connection.readyState === 1;
  }

  find(query = {}) {
    if (this.isMongoActive) {
      return MongoosePortfolioSnapshotModel.find(query);
    }

    const execute = () => {
      let results = inMemorySnapshots.filter((s) => {
        if (query.user && s.user.toString() !== query.user.toString()) return false;
        return true;
      });
      results.sort((a, b) => new Date(a.date) - new Date(b.date));
      return results;
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

  async create(data) {
    if (this.isMongoActive) {
      return await MongoosePortfolioSnapshotModel.create(data);
    }

    const newSnapshot = {
      _id: `snp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      user: data.user,
      portfolio: data.portfolio,
      date: data.date || new Date(),
      totalValue: Number(data.totalValue),
      cashBalance: Number(data.cashBalance),
      investedAmount: Number(data.investedAmount),
      pnl: Number(data.pnl || 0),
      pnlPercent: Number(data.pnlPercent || 0),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    inMemorySnapshots.push(newSnapshot);
    return newSnapshot;
  }
}

export const PortfolioSnapshot = new HybridSnapshotRepository();
