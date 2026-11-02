import { HelpAuthoringController } from './help-authoring.controller';
import { REQUIRE_SESSION_AUTH_KEY } from '../../common/decorators/require-session-auth.decorator';

describe('HelpAuthoringController', () => {
  it('requires interactive session authentication on its controller', () => {
    expect(
      Reflect.getMetadata(REQUIRE_SESSION_AUTH_KEY, HelpAuthoringController),
    ).toBe(true);
  });
  it('lists only active members of the authenticated workspace and returns a minimal identity', async () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest
        .fn()
        .mockResolvedValue([
          {
            id: 'member',
            name: 'Member',
            email: 'member@example.test',
            role: 'member',
          },
        ]),
    };
    const db = { selectFrom: jest.fn().mockReturnValue(query) };
    const controller = new HelpAuthoringController(db as any);
    const result = await controller.session(
      {
        id: 'admin',
        name: 'Admin',
        email: 'admin@example.test',
        role: 'owner',
        password: 'never-return',
      } as any,
      { id: 'workspace-a', licenseKey: 'never-return' } as any,
    );
    expect(query.where.mock.calls).toEqual([
      ['workspaceId', '=', 'workspace-a'],
      ['deletedAt', 'is', null],
      ['deactivatedAt', 'is', null],
    ]);
    expect(result).toEqual({
      workspaceId: 'workspace-a',
      user: {
        id: 'admin',
        name: 'Admin',
        email: 'admin@example.test',
        role: 'owner',
      },
      members: [
        {
          id: 'member',
          name: 'Member',
          email: 'member@example.test',
          role: 'member',
        },
      ],
    });
  });
});
