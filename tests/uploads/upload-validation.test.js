const { imageFileFilter } = require('../../src/uploads/upload-middleware');

test('defers MIME validation to content inspection', (done) => {
  imageFileFilter({}, { mimetype: 'application/octet-stream' }, (error, accepted) => {
    expect(error).toBeNull();
    expect(accepted).toBe(true);
    done();
  });
});
