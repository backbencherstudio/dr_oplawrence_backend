// external imports
import { Command, CommandRunner } from 'nest-commander';
// internal imports
import appConfig from '../config/app.config';
import { StringHelper } from '../common/helper/string.helper';
import { UserRepository } from '../common/repository/user/user.repository';
import { PrismaService } from '../prisma/prisma.service';

@Command({ name: 'seed', description: 'prisma db seed' })
export class SeedCommand extends CommandRunner {
  constructor(private readonly prisma: PrismaService) {
    super();
  }
  async run(passedParam: string[]): Promise<void> {
    await this.seed(passedParam);
  }

  async seed(param: string[]) {
    try {
      console.log(`Prisma Env: ${process.env.PRISMA_ENV}`);
      console.log('Seeding started...');

      // begin transaaction
      await this.prisma.$transaction(async ($tx) => {
        await this.roleSeed();
        await this.permissionSeed();
        await this.userSeed();
        await this.permissionRoleSeed();
        await this.prayerSeed();
      });

      console.log('Seeding done.');
    } catch (error) {
      throw error;
    }
  }

  //---- user section ----
  async userSeed() {
    // system admin, user id: 1
    const systemUser = await UserRepository.createSuAdminUser({
      username: appConfig().defaultUser.system.username,
      email: appConfig().defaultUser.system.email,
      password: appConfig().defaultUser.system.password,
    });

    await this.prisma.roleUser.create({
      data: {
        user_id: systemUser.id,
        role_id: '1',
      },
    });
  }

  async permissionSeed() {
    let i = 0;
    const permissions = [];
    const permissionGroups = [
      // (system level )super admin level permission
      { title: 'system_tenant_management', subject: 'SystemTenant' },
      // end (system level )super admin level permission
      { title: 'user_management', subject: 'User' },
      { title: 'role_management', subject: 'Role' },
      // Project
      { title: 'Project', subject: 'Project' },
      // Task
      {
        title: 'Task',
        subject: 'Task',
        scope: ['read', 'create', 'update', 'show', 'delete', 'assign'],
      },
      // Comment
      { title: 'Comment', subject: 'Comment' },
    ];

    for (const permissionGroup of permissionGroups) {
      if (permissionGroup['scope']) {
        for (const permission of permissionGroup['scope']) {
          permissions.push({
            id: String(++i),
            title: permissionGroup.title + '_' + permission,
            action: StringHelper.cfirst(permission),
            subject: permissionGroup.subject,
          });
        }
      } else {
        for (const permission of [
          'read',
          'create',
          'update',
          'show',
          'delete',
        ]) {
          permissions.push({
            id: String(++i),
            title: permissionGroup.title + '_' + permission,
            action: StringHelper.cfirst(permission),
            subject: permissionGroup.subject,
          });
        }
      }
    }

    await this.prisma.permission.createMany({
      data: permissions,
    });
  }

  async permissionRoleSeed() {
    const all_permissions = await this.prisma.permission.findMany();
    const su_admin_permissions = all_permissions.filter(function (permission) {
      return permission.title.substring(0, 25) == 'system_tenant_management_';
    });
    // const su_admin_permissions = all_permissions;

    // -----su admin permission---
    const adminPermissionRoleArray = [];
    for (const su_admin_permission of su_admin_permissions) {
      adminPermissionRoleArray.push({
        role_id: '1',
        permission_id: su_admin_permission.id,
      });
    }
    await this.prisma.permissionRole.createMany({
      data: adminPermissionRoleArray,
    });
    // -----------

    // ---admin---
    const project_admin_permissions = all_permissions.filter(
      function (permission) {
        return permission.title.substring(0, 25) != 'system_tenant_management_';
      },
    );

    const projectAdminPermissionRoleArray = [];
    for (const admin_permission of project_admin_permissions) {
      projectAdminPermissionRoleArray.push({
        role_id: '2',
        permission_id: admin_permission.id,
      });
    }
    await this.prisma.permissionRole.createMany({
      data: projectAdminPermissionRoleArray,
    });
    // -----------

    // ---project manager---
    const project_manager_permissions = all_permissions.filter(
      function (permission) {
        return (
          permission.title == 'project_read' ||
          permission.title == 'project_show' ||
          permission.title == 'project_update' ||
          permission.title.substring(0, 4) == 'Task' ||
          permission.title.substring(0, 7) == 'Comment'
        );
      },
    );

    const projectManagerPermissionRoleArray = [];
    for (const project_manager_permission of project_manager_permissions) {
      projectManagerPermissionRoleArray.push({
        role_id: '3',
        permission_id: project_manager_permission.id,
      });
    }
    await this.prisma.permissionRole.createMany({
      data: projectManagerPermissionRoleArray,
    });
    // -----------

    // ---member---
    const member_permissions = all_permissions.filter(function (permission) {
      return (
        permission.title == 'project_read' ||
        permission.title == 'project_show' ||
        permission.title == 'task_read' ||
        permission.title == 'task_show' ||
        permission.title == 'task_update' ||
        permission.title.substring(0, 7) == 'comment'
      );
    });

    const memberPermissionRoleArray = [];
    for (const project_manager_permission of member_permissions) {
      memberPermissionRoleArray.push({
        role_id: '4',
        permission_id: project_manager_permission.id,
      });
    }
    await this.prisma.permissionRole.createMany({
      data: memberPermissionRoleArray,
    });
    // -----------

    // ---viewer---
    const viewer_permissions = all_permissions.filter(function (permission) {
      return (
        permission.title == 'project_read' ||
        permission.title == 'project_show' ||
        permission.title == 'task_read' ||
        permission.title == 'comment_read'
      );
    });

    const viewerPermissionRoleArray = [];
    for (const viewer_permission of viewer_permissions) {
      viewerPermissionRoleArray.push({
        role_id: '5',
        permission_id: viewer_permission.id,
      });
    }
    await this.prisma.permissionRole.createMany({
      data: viewerPermissionRoleArray,
    });
    // -----------
  }

  async roleSeed() {
    await this.prisma.role.createMany({
      data: [
        // system role
        {
          id: '1',
          title: 'Super Admin', // system admin, do not assign to a tenant/user
          name: 'su_admin',
        },
        // organization role
        {
          id: '2',
          title: 'Admin',
          name: 'admin',
        },
        {
          id: '3',
          title: 'Project Manager',
          name: 'project_manager',
        },
        {
          id: '4',
          title: 'Member',
          name: 'member',
        },
        {
          id: '5',
          title: 'Viewer',
          name: 'viewer',
        },
      ],
    });
  }

  async prayerSeed() {
    await this.prisma.prayer.createMany({
      data: [
        {
          text: "May today bring us strength, joy, and the wisdom to navigate life's challenges with grace and faith.",
        },
        {
          text: 'Grant us courage to face the day, compassion for those we meet, and peace in our hearts.',
        },
        {
          text: 'Help us to see the good in others, to be humble in our success, and to remain faithful in our struggles.',
        },
        {
          text: 'Guide our steps, illuminate our path, and fill our hearts with love and purpose.',
        },
        {
          text: 'May we find strength in unity, wisdom in silence, and hope in every new day.',
        },
        {
          text: 'Bless us with patience to endure, strength to persevere, and faith to believe in better days ahead.',
        },
        {
          text: 'Let us walk in love, speak in truth, and serve with a humble heart.',
        },
        {
          text: 'Grant us the serenity to accept what we cannot change, the courage to change what we can, and the wisdom to know the difference.',
        },
        {
          text: 'May our actions reflect our values, our words bring healing, and our presence bring comfort to those around us.',
        },
        {
          text: 'Help us to forgive as we wish to be forgiven, to love unconditionally, and to serve selflessly.',
        },
      ],
      skipDuplicates: true,
    });
  }
}
