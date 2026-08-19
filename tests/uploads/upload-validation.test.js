const { imageFileFilter } = require('../../src/uploads/upload-middleware');

test('accepts supported image MIME types', (done) => {
  imageFileFilter({}, { mimetype: 'image/webp' }, (error, accepted) => {
    expect(error).toBeNull();
    expect(accepted).toBe(true);
    done();
  });
});

test('normalizes MIME type parameters and casing', (done) => {
  imageFileFilter({}, { mimetype: 'IMAGE/PNG; charset=binary' }, (error, accepted) => {
    expect(error).toBeNull();
    expect(accepted).toBe(true);
    done();
  });
});

test('rejects unsupported MIME types', (done) => {
  imageFileFilter({}, { mimetype: 'image/svg+xml' }, (error) => {
    expect(error.code).toBe('VALIDATION_ERROR');
    done();
  });
});
