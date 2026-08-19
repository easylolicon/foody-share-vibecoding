class StorageProvider {
  async save() {
    throw new Error('StorageProvider.save must be implemented');
  }

  async delete() {
    throw new Error('StorageProvider.delete must be implemented');
  }

  publicUrl() {
    throw new Error('StorageProvider.publicUrl must be implemented');
  }
}

module.exports = StorageProvider;
