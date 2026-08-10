from django.contrib.auth.models import AbstractUser
from django.db.models import CharField, EmailField, DateField, Model, ForeignKey, TextField, DecimalField, TimeField
from django.db.models import ImageField, DateTimeField, JSONField, PositiveIntegerField, BooleanField
from django.db.models.deletion import SET_NULL, CASCADE
from django.db.models.enums import TextChoices
from parler.models import TranslatableModel, TranslatedFields

from apps.manager import CustomUserManager


class User(AbstractUser):
    class GenderTextChoices(TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"

    EMAIL_FIELD = "email"
    USERNAME_FIELD = "phone_number"
    REQUIRED_FIELDS = ["email"]
    objects = CustomUserManager()
    username = None
    phone_number = CharField(max_length=20, unique=True, db_index=True)
    email = EmailField(unique=True, db_index=True)
    gender = CharField(max_length=10, choices=GenderTextChoices.choices, null=True, blank=True)
    birth_date = DateField(null=True, blank=True)
    country = ForeignKey("apps.Country", null=True, blank=True, related_name="users", on_delete=SET_NULL)
    groups = None


class Country(TranslatableModel):
    translations = TranslatedFields(
        name=CharField(max_length=100)
    )

    class Meta:
        verbose_name = "country"
        verbose_name_plural = "countries"
        db_table = "apps_countries"


class Questions(Model):
    question = TextField()
    answer = TextField()
    is_visible = BooleanField(default=False)


class SalesOutlets(Model):
    latitude = DecimalField(max_digits=9, decimal_places=6)
    longitude = DecimalField(max_digits=9, decimal_places=6)
    phone_number = JSONField(default=list)
    start_time = TimeField()
    end_time = TimeField()
    place = ForeignKey("apps.Place", related_name="sales", on_delete=SET_NULL, null=True)

    class Meta:
        verbose_name = "sales_outlet"
        verbose_name_plural = "sales_outlets"
        db_table = "apps_sales_outlets"


class Place(TranslatableModel):
    translations = TranslatedFields(
        title=CharField(max_length=155),
        name=CharField(max_length=200)
    )
    phone_number = CharField(max_length=20)
    image = ImageField(null=True, blank=True, upload_to="place/")


class Category(TranslatableModel):
    translations = TranslatedFields(name=CharField(max_length=255))

    class Meta:
        verbose_name = "category"
        verbose_name_plural = "categories"
        db_table = "apps_categories"


class Event(TranslatableModel):
    translations = TranslatedFields(
        title=CharField(max_length=355),
        description=TextField()
    )
    image = ImageField(null=True, blank=True, upload_to="events/")
    category = ForeignKey("apps.Category", null=True, blank=True, related_name="events", on_delete=SET_NULL)
    latitude = DecimalField(max_digits=9, decimal_places=6)
    longitude = DecimalField(max_digits=9, decimal_places=6)
    start_datetime = DateTimeField(null=True, blank=True)
    end_datetime = DateTimeField(null=True, blank=True)
    restriction = JSONField(default=dict, null=True, blank=True)
    place = ForeignKey("apps.Place", null=True, blank=True, related_name="events", on_delete=SET_NULL)


class Ticket(TranslatableModel):
    translations = TranslatedFields(
        title=CharField(max_length=355),
        description=TextField()
    )
    price = DecimalField(max_digits=9, decimal_places=3)
    count = PositiveIntegerField(default=0)
    even = ForeignKey("apps.Event", null=True, blank=True, related_name="tickets", on_delete=CASCADE)


class Wishlist(Model):
    event = ForeignKey("apps.Event", related_name="wishlists", on_delete=CASCADE, db_index=True)
    user = ForeignKey("apps.User", related_name="wishlists", on_delete=CASCADE, db_index=True)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)


class OrderItem(Model):
    event = ForeignKey("apps.Event", related_name="order_items", on_delete=CASCADE, db_index=True)
    user = ForeignKey("apps.User", null=True, blank=True, related_name="order_items", on_delete=CASCADE, db_index=True)
    datetime = DateTimeField(auto_now_add=True)
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "order_item"
        verbose_name_plural = "order_items"
        db_table = "apps_order_items"


class Order(Model):
    class StatusTextChoices(TextChoices):
        PENDING = "pending", "Pending"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"
        FAILED = "failed", "Failed"

    user_id = ForeignKey("apps.User", related_name="orders", on_delete=CASCADE, db_index=True)
    item = ForeignKey("apps.OrderItem", related_name="order", on_delete=CASCADE, db_index=True)
    status = CharField(max_length=30, choices=StatusTextChoices.choices, default=StatusTextChoices.PENDING)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)


class Payment(Model):
    class StatusTextChoices(TextChoices):
        PENDING = "pending", "Pending"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"
        REFUNDED = "refunded", "Refunded"

    total_amount = DecimalField(max_digits=9, decimal_places=6)
    order = ForeignKey("apps.Order", related_name="payments", on_delete=SET_NULL, db_index=True, null=True)
    status = CharField(max_length=30, choices=StatusTextChoices.choices, default=StatusTextChoices.PENDING)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)


class Transaction(Model):
    class StatusTextChoices(TextChoices):
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"

    payment = ForeignKey("apps.Payment", on_delete=SET_NULL, related_name="transactions", db_index=True, null=True)
    status = CharField(
        max_length=30, choices=StatusTextChoices.choices, default=StatusTextChoices.SUCCESS, db_index=True
    )
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)


class Address(Model):
    class Meta:
        verbose_name = "address"
        verbose_name_plural = "addresses"
        db_table = "apps_addresses"

    title = CharField(max_length=500)
    street = CharField(max_length=300)
    city = CharField(max_length=300)
    building = CharField(max_length=300)
    apparition = CharField(max_length=300)
    email_index = CharField(max_length=155)
    addintional_information = TextField()
    user = ForeignKey("apps.User", related_name="addresses", on_delete=CASCADE, db_index=True)
    country = ForeignKey("apps.Country", related_name="addresses", on_delete=SET_NULL, db_index=True, null=True)
