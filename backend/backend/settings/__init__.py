from .base import *

# Import environment specific settings
import os
env = os.getenv('DJANGO_ENV', 'development')

if env == 'production':
    from .production import *
else:
    from .development import * 