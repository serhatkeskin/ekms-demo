"""Seed the database with a demo user, project, and sample pages."""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Create demo data for portfolio demonstration."

    def handle(self, *args, **options):
        self._create_users()
        self._create_project()
        self._create_roles()
        self._create_pages()
        self.stdout.write(self.style.SUCCESS("Demo data created successfully."))

    def _create_users(self):
        demo_users = [
            {"email": "admin@demo.com", "username": "admin", "password": "demo1234", "is_superuser": True, "is_staff": True},
            {"email": "alice@demo.com", "username": "alice", "password": "demo1234"},
            {"email": "bob@demo.com", "username": "bob", "password": "demo1234"},
        ]
        for data in demo_users:
            is_superuser = data.pop("is_superuser", False)
            is_staff = data.pop("is_staff", False)
            password = data.pop("password")
            user, created = User.objects.get_or_create(
                email=data["email"],
                defaults={**data, "is_superuser": is_superuser, "is_staff": is_staff},
            )
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(f"  Created user: {user.username}")

    def _create_project(self):
        from projects.models import Project, ProjectRole, ProjectMembership

        project, created = Project.objects.get_or_create(
            name="EKMS Demo",
            defaults={"description": "Portfolio demo of EKMS: Enterprise Knowledge Management System"},
        )
        if created:
            self.stdout.write(f"  Created project: {project.name}")

        admin = User.objects.filter(username="admin").first()
        if admin:
            role, _ = ProjectRole.objects.get_or_create(
                name="manager",
                defaults={"can_view": True, "can_create": True, "can_edit": True, "can_delete": True, "is_supermanager": True},
            )
            ProjectMembership.objects.get_or_create(user=admin, project=project, defaults={"role": role})

        alice = User.objects.filter(username="alice").first()
        if alice:
            editor_role, _ = ProjectRole.objects.get_or_create(
                name="editor",
                defaults={"can_view": True, "can_create": True, "can_edit": True, "can_delete": False, "is_supermanager": False},
            )
            ProjectMembership.objects.get_or_create(user=alice, project=project, defaults={"role": editor_role})

    def _create_roles(self):
        from projects.models import ProjectRole
        ProjectRole.objects.get_or_create(
            name="viewer",
            defaults={"can_view": True, "can_create": False, "can_edit": False, "can_delete": False},
        )

    def _create_pages(self):
        import uuid
        from projects.models import Project
        from pages.models import Page, Block

        project = Project.objects.filter(name="EKMS Demo").first()
        admin = User.objects.filter(username="admin").first()
        if not project or not admin:
            return

        page, created = Page.objects.get_or_create(
            title="Welcome to EKMS",
            defaults={
                "project": project,
                "status": Page.PUBLIC,
                "created_by": admin,
                "updated_by": admin,
                "last_edited_by": admin,
            },
        )
        if created:
            self.stdout.write(f"  Created page: {page.title}")
            Block.objects.create(
                page=page,
                block_type=Block.PARAGRAPH,
                order=0,
                content={
                    "id": str(uuid.uuid4()),
                    "type": "paragraph",
                    "props": {"textColor": "default", "backgroundColor": "default", "textAlignment": "left"},
                    "content": [{"type": "text", "text": "Welcome to EKMS, an Enterprise Knowledge Management System demo. Use the sidebar to navigate pages, create content, and collaborate.", "styles": {}}],
                    "children": [],
                },
                created_by=admin,
                updated_by=admin,
            )
