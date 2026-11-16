import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Transaction must belong to a user'],
      index: true,
    },
    portfolio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portfolio',
    },
    symbol: {
      type: String,
      required: [true, 'Asset symbol is required'],
      uppercase: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company or asset name is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Transaction action type is required'],
      enum: {
        values: ['BUY', 'SELL', 'CREDIT', 'DEBIT'],
        message: '{VALUE} is not a valid transaction action type',
      },
      index: true,
    },
    orderType: {
      type: String,
      enum: ['MARKET', 'LIMIT', 'SYSTEM_GRANT'],
      default: 'MARKET',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1 share'],
    },
    price: {
      type: Number,
      required: [true, 'Executed price is required'],
      min: [0, 'Executed price cannot be negative'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total transaction value is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'PENDING', 'CANCELLED', 'FAILED'],
      default: 'COMPLETED',
      index: true,
    },
    executionDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// High-speed compound indexes for ledger queries
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ symbol: 1 });

export const MongooseTransactionModel = mongoose.model('Transaction', transactionSchema);

// In-Memory Dev Store
const inMemoryTransactions = [];

class HybridTransactionRepository {
  get isMongoActive() {
    return mongoose.connection.readyState === 1;
  }

  find(query = {}) {
    if (this.isMongoActive) {
      return MongooseTransactionModel.find(query);
    }

    const execute = () => {
      let results = inMemoryTransactions.filter((t) => {
        if (query.user && t.user.toString() !== query.user.toString()) return false;
        if (query.type && t.type !== query.type) return false;
        if (query.symbol && t.symbol !== query.symbol.toUpperCase()) return false;
        return true;
      });

      // Default sort by createdAt descending
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return results;
    };

    return {
      sort: function () {
        return this;
      },
      limit: function (n) {
        return {
          then: function (resolve, reject) {
            try {
              resolve(execute().slice(0, n));
            } catch (err) {
              reject(err);
            }
          },
        };
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

  findById(id) {
    if (this.isMongoActive) {
      return MongooseTransactionModel.findById(id);
    }

    const execute = () => {
      const match = inMemoryTransactions.find((t) => t._id.toString() === id.toString());
      return match || null;
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
      return await MongooseTransactionModel.create(data);
    }

    const newTxn = {
      _id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      user: data.user,
      portfolio: data.portfolio,
      symbol: data.symbol.toUpperCase(),
      companyName: data.companyName,
      type: data.type,
      orderType: data.orderType || 'MARKET',
      quantity: Number(data.quantity),
      price: Number(data.price),
      totalAmount: Number(data.totalAmount),
      status: data.status || 'COMPLETED',
      executionDate: data.executionDate || new Date(),
      notes: data.notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    inMemoryTransactions.unshift(newTxn);
    return newTxn;
  }
}

export const Transaction = new HybridTransactionRepository();
