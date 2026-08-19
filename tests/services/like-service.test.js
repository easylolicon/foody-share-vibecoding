const LikeService = require('../../src/services/like-service');

test('toggles a new anonymous like', async () => {
  const connection = { beginTransaction: jest.fn(), commit: jest.fn(), rollback: jest.fn(), release: jest.fn() };
  const repository = {
    getCount: jest.fn().mockResolvedValueOnce({ likeCount: 2 }).mockResolvedValueOnce({ likeCount: 3 }),
    find: jest.fn().mockResolvedValue(null),
    insert: jest.fn(),
  };
  const service = new LikeService({ db: { getConnection: async () => connection }, repository });
  await expect(service.toggle(1, 'visitor_1234567890')).resolves.toEqual({ liked: true, likeCount: 3 });
  expect(repository.insert).toHaveBeenCalledWith(connection, 1, 'visitor_1234567890');
});

test('removes an existing anonymous like', async () => {
  const connection = { beginTransaction: jest.fn(), commit: jest.fn(), rollback: jest.fn(), release: jest.fn() };
  const repository = {
    getCount: jest.fn().mockResolvedValueOnce({ likeCount: 3 }).mockResolvedValueOnce({ likeCount: 2 }),
    find: jest.fn().mockResolvedValue({ id: 7 }),
    remove: jest.fn(),
  };
  const service = new LikeService({ db: { getConnection: async () => connection }, repository });
  await expect(service.toggle(1, 'visitor_1234567890')).resolves.toEqual({ liked: false, likeCount: 2 });
  expect(repository.remove).toHaveBeenCalledWith(connection, 7, 1);
});
