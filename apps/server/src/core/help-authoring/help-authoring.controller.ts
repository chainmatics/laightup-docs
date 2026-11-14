import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import { KyselyDB } from '@docmost/db/types/kysely.types';
import { User, Workspace } from '@docmost/db/types/entity.types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequireSessionAuth } from '../../common/decorators/require-session-auth.decorator';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { AuthWorkspace } from '../../common/decorators/auth-workspace.decorator';

/** Session attestation for the loopback-only authoring service. No token is returned. */
@Controller('help-authoring')
@UseGuards(JwtAuthGuard)
@RequireSessionAuth()
export class HelpAuthoringController {
  constructor(@InjectKysely() private readonly db: KyselyDB) {}

  @Get('session')
  @Header('Cache-Control', 'no-store')
  async session(@AuthUser() user: User, @AuthWorkspace() workspace: Workspace) {
    const members = await this.db
      .selectFrom('users')
      .select(['id', 'name', 'email', 'role'])
      .where('workspaceId', '=', workspace.id)
      .where('deletedAt', 'is', null)
      .where('deactivatedAt', 'is', null)
      .execute();
    return {
      workspaceId: workspace.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      members,
    };
  }
}
