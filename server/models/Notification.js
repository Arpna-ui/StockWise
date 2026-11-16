import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must be linked to a user'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['INFO', 'SUCCESS', 'WARNING', 'ALERT', 'TRADE'],
      default: 'INFO',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    link: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const MongooseNotificationModel = mongoose.model('Notification', notificationSchema);

// In-Memory Dev Store
const inMemoryNotifications = [];

class HybridNotificationRepository {
  get isMongoActive() {
    return mongoose.connection.readyState === 1;
  }

  find(query = {}) {
    if (this.isMongoActive) {
      return MongooseNotificationModel.find(query);
    }

    const execute = () => {
      let results = inMemoryNotifications.filter((n) => {
        if (query.user && n.user.toString() !== query.user.toString()) return false;
        if (query.isRead !== undefined && n.isRead !== query.isRead) return false;
        return true;
      });
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return results;
    };

    return {
      sort: function () {
        return this;
      },
      limit: function (limitCount) {
        return {
          then: function (resolve, reject) {
            try {
              resolve(execute().slice(0, limitCount));
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
      return MongooseNotificationModel.findById(id);
    }

    const execute = () => {
      const match = inMemoryNotifications.find((n) => n._id.toString() === id.toString());
      if (!match) return null;

      return {
        ...match,
        save: async function () {
          const idx = inMemoryNotifications.findIndex((x) => x._id === this._id);
          if (idx !== -1) inMemoryNotifications[idx] = this;
          return this;
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

  async updateMany(query, update) {
    if (this.isMongoActive) {
      return await MongooseNotificationModel.updateMany(query, update);
    }
    let count = 0;
    inMemoryNotifications.forEach((n) => {
      if (query.user && n.user.toString() !== query.user.toString()) return;
      if (query.isRead !== undefined && n.isRead !== query.isRead) return;
      if (update.$set) {
        Object.assign(n, update.$set);
      } else {
        Object.assign(n, update);
      }
      n.updatedAt = new Date();
      count++;
    });
    return { modifiedCount: count };
  }

  async deleteMany(query) {
    if (this.isMongoActive) {
      return await MongooseNotificationModel.deleteMany(query);
    }
    const initialLen = inMemoryNotifications.length;
    for (let i = inMemoryNotifications.length - 1; i >= 0; i--) {
      const n = inMemoryNotifications[i];
      if (query.user && n.user.toString() !== query.user.toString()) continue;
      inMemoryNotifications.splice(i, 1);
    }
    return { deletedCount: initialLen - inMemoryNotifications.length };
  }

  async findByIdAndDelete(id) {
    if (this.isMongoActive) {
      return await MongooseNotificationModel.findByIdAndDelete(id);
    }
    const idx = inMemoryNotifications.findIndex((n) => n._id.toString() === id.toString());
    if (idx !== -1) {
      return inMemoryNotifications.splice(idx, 1)[0];
    }
    return null;
  }

  async create(data) {
    if (this.isMongoActive) {
      return await MongooseNotificationModel.create(data);
    }

    const newNotif = {
      _id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      user: data.user,
      title: data.title,
      message: data.message,
      type: data.type || 'INFO',
      isRead: false,
      link: data.link || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    inMemoryNotifications.unshift(newNotif);
    return newNotif;
  }
}

export const Notification = new HybridNotificationRepository();
