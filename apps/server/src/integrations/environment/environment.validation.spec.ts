import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EnvironmentVariables } from './environment.validation';

describe('mail driver configuration', () => {
  const config = {
    DATABASE_URL: 'postgresql://user:password@127.0.0.1:5432/test',
    REDIS_URL: 'redis://127.0.0.1:6379',
    APP_SECRET: 'a-local-test-secret-with-at-least-32-characters',
  };
  it('allows the existing log-only driver so local acceptance tests send no mail', () => {
    expect(
      validateSync(
        plainToInstance(EnvironmentVariables, {
          ...config,
          MAIL_DRIVER: 'log',
        }),
      ),
    ).toEqual([]);
  });
  it('rejects unsupported mail drivers', () => {
    const errors = validateSync(
      plainToInstance(EnvironmentVariables, {
        ...config,
        MAIL_DRIVER: 'unknown',
      }),
    );
    expect(errors.some((error) => error.property === 'MAIL_DRIVER')).toBe(true);
  });
});
