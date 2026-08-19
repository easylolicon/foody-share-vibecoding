const { PostService, validatePostInput } = require('../../src/services/post-service');

test('validates nickname and image count', () => {
  expect(() => validatePostInput({ nickname: '', files: [{}] })).toThrow('请输入昵称');
  expect(() => validatePostInput({ nickname: '小明', files: [] })).toThrow('请选择 1-3 张图片');
  expect(validatePostInput({ nickname: ' 小明 ', description: ' 午饭 ', files: [{}] })).toEqual({
    nickname: '小明',
    description: '午饭',
  });
});

test('enforces the 20-character nickname and 100-character description limits', () => {
  expect(() => validatePostInput({ nickname: 'a'.repeat(21), files: [{}] }))
    .toThrow('昵称不能超过 20 个字符');
  expect(() => validatePostInput({ nickname: '小明', description: 'a'.repeat(101), files: [{}] }))
    .toThrow('描述不能超过 100 个字符');
});

test('cleans saved files when the database insert fails', async () => {
  const deleteFile = jest.fn();
  const connection = {
    beginTransaction: jest.fn(), rollback: jest.fn().mockResolvedValue(), release: jest.fn(),
  };
  const service = new PostService({
    db: { getConnection: async () => connection },
    repository: { insertPost: async () => { throw new Error('database down'); } },
    storage: { save: async () => ({ key: 'one.jpg', url: '/uploads/one.jpg' }), delete: deleteFile },
  });

  await expect(service.create({ nickname: '小明', files: [{}] })).rejects.toThrow('database down');
  expect(connection.rollback).toHaveBeenCalled();
  expect(deleteFile).toHaveBeenCalledWith('one.jpg');
});
