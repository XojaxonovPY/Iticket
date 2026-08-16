from django.contrib.auth.models import AbstractUser
from django.db.models import (
    CharField, EmailField, DateField, Model, ForeignKey, TextField, DecimalField, TimeField,
    ImageField, DateTimeField, JSONField, PositiveIntegerField, BooleanField
)
from django.db.models.deletion import SET_NULL, CASCADE
from django.db.models.enums import TextChoices
from parler.models import TranslatableModel, TranslatedFields

from apps.commons.manager import CustomUserManager


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

    def __str__(self):
        full_name = self.get_full_name().strip()
        if full_name:
            return f"{full_name} ({self.phone_number})"
        return self.phone_number or self.email or f"User #{self.pk}"


class Country(TranslatableModel):
    translations = TranslatedFields(
        name=CharField(max_length=100)
    )

    class Meta:
        verbose_name = "country"
        verbose_name_plural = "countries"
        db_table = "apps_countries"

    def __str__(self):
        return self.safe_translation_getter("name", any_language=True) or f"Country #{self.pk}"


class Question(Model):
    question = TextField()
    answer = TextField()
    is_visible = BooleanField(default=False)

    def __str__(self):
        if len(self.question) > 50:
            return f"{self.question[:50]}..."
        return self.question or f"Question #{self.pk}"


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

    def __str__(self):
        place_str = str(self.place) if self.place else f"Outlet #{self.pk}"
        return f"{place_str} ({self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')})"


class Place(TranslatableModel):
    translations = TranslatedFields(
        title=CharField(max_length=155),
        name=CharField(max_length=200)
    )
    phone_number = CharField(max_length=20)
    image = ImageField(null=True, blank=True, upload_to="place/")

    def __str__(self):
        title = self.safe_translation_getter("title", any_language=True)
        name = self.safe_translation_getter("name", any_language=True)
        return title or name or f"Place #{self.pk}"


class Category(TranslatableModel):
    translations = TranslatedFields(name=CharField(max_length=255))

    class Meta:
        verbose_name = "category"
        verbose_name_plural = "categories"
        db_table = "apps_categories"

    def __str__(self):
        return self.safe_translation_getter("name", any_language=True) or f"Category #{self.pk}"


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

    def __str__(self):
        return self.safe_translation_getter("title", any_language=True) or f"Event #{self.pk}"


class Ticket(TranslatableModel):
    translations = TranslatedFields(
        title=CharField(max_length=355),
        description=TextField()
    )
    price = DecimalField(max_digits=9, decimal_places=3)
    count = PositiveIntegerField(default=0)
    even = ForeignKey("apps.Event", null=True, blank=True, related_name="tickets", on_delete=CASCADE)

    def __str__(self):
        title = self.safe_translation_getter("title", any_language=True) or "Ticket"
        even_str = str(self.even) if self.even else "No Event"
        return f"{title} ({self.price} UZS) - {even_str}"


class Wishlist(Model):
    event = ForeignKey("apps.Event", related_name="wishlists", on_delete=CASCADE, db_index=True)
    user = ForeignKey("apps.User", related_name="wishlists", on_delete=CASCADE, db_index=True)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)

    def __str__(self):
        return f"Wishlist: {self.user} -> {self.event}"


class OrderItem(Model):
    ticket = ForeignKey("apps.Ticket", related_name="order_items", on_delete=CASCADE, db_index=True)
    user = ForeignKey("apps.User", null=True, blank=True, related_name="order_items", on_delete=CASCADE, db_index=True)
    count = PositiveIntegerField(default=0)
    datetime = DateTimeField(auto_now_add=True)
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "order_item"
        verbose_name_plural = "order_items"
        db_table = "apps_order_items"

    def __str__(self):
        user_str = str(self.user) if self.user else "Anonymous"
        return f"OrderItem #{self.pk} ({self.ticket} for {user_str})"


class Order(Model):
    class StatusTextChoices(TextChoices):
        PENDING = "pending", "Pending"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"
        FAILED = "failed", "Failed"

    user = ForeignKey("apps.User", related_name="orders", on_delete=SET_NULL, db_index=True, null=True)
    status = CharField(max_length=30, choices=StatusTextChoices.choices, default=StatusTextChoices.PENDING)
    total_amount = DecimalField(max_digits=10, decimal_places=3)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.pk} - {self.user} [{self.get_status_display()}]"


class Payment(Model):
    class StatusTextChoices(TextChoices):
        PENDING = "pending", "Pending"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"
        REFUNDED = "refunded", "Refunded"

    total_amount = DecimalField(max_digits=10, decimal_places=3)
    order = ForeignKey("apps.Order", related_name="payments", on_delete=SET_NULL, db_index=True, null=True)
    status = CharField(max_length=30, choices=StatusTextChoices.choices, default=StatusTextChoices.PENDING)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment #{self.pk} ({self.total_amount} UZS) [{self.get_status_display()}]"


class Transaction(Model):
    class StatusTextChoices(TextChoices):
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"

    payment = ForeignKey("apps.Payment", on_delete=SET_NULL, related_name="transactions", db_index=True, null=True)
    status = CharField(
        max_length=30, choices=StatusTextChoices.choices, default=StatusTextChoices.SUCCESS, db_index=True
    )
    amount = DecimalField(max_digits=10, decimal_places=3)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)

    def __str__(self):
        return f"Transaction #{self.pk} [{self.get_status_display()}]"


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

    def __str__(self):
        return f"{self.title} ({self.city}, {self.street})"
