module.exports = {
  collectCoverageFrom: ['**/*.js?(x)'],
  transform: { '^.+\\.js$': 'babel-jest' },
  modulePathIgnorePatterns: ['npm-cache', '.npm'],
  rootDir: '.',
  testMatch: ['<rootDir>/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/__mocks__/', '.eslintrc.js'],
};
