def allow_access_to_admins(user):
    return user.is_superuser or user.is_staff
