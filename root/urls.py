"""
URL configuration for root project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.api import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.api'))
"""
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path

from apps.api import api
from root.settings import MEDIA_URL, MEDIA_ROOT

urlpatterns = [
    path('admin/', admin.site.urls),
    path("", api.urls)
]

urlpatterns += static(MEDIA_URL, document_root=MEDIA_ROOT)
