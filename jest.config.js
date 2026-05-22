module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.(t|j)s', '!src/**/*.module.ts', '!src/main.ts'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@entities/(.*)$': '<rootDir>/src/entities/$1',
    '^@enums/(.*)$': '<rootDir>/src/enums/$1',
    '^@dto/(.*)$': '<rootDir>/src/dto/$1',
  },
  roots: ['<rootDir>/src/', '<rootDir>/test/'],
};
