"""
Seed script — populates the database with demo data for development.
Run: python seed.py
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text
from datetime import datetime, timezone, timedelta
import random

from app.core.config import settings
from app.core.security import get_password_hash
from app.models import *
from app.db.database import Base

engine = create_async_engine(settings.DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

BRANDS = ["ZARA", "H&M", "LC Waikiki", "Terranova", "Colin's", "Mango", "Reserved", "House"]
CITIES = ["Tashkent", "Samarkand", "Bukhara", "Namangan", "Andijan", "Fergana", "Nukus"]
COLORS = ["Red", "Blue", "Black", "White", "Green", "Navy", "Beige", "Grey", "Brown"]
SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"]
MATERIALS = ["Cotton", "Polyester", "Linen", "Denim", "Wool", "Silk", "Synthetic blend"]
CATEGORIES = list(ProductCategory)


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tables created")


async def clear_tables():
    async with engine.begin() as conn:
        if engine.dialect.name == "postgresql":
            table_names = [table.name for table in Base.metadata.sorted_tables]
            if table_names:
                tables_str = ", ".join(f'"{name}"' for name in table_names)
                await conn.execute(text(f"TRUNCATE TABLE {tables_str} RESTART IDENTITY CASCADE;"))
        else:
            for table in reversed(Base.metadata.sorted_tables):
                await conn.execute(text(f"DELETE FROM {table.name};"))
    print("✅ Existing data cleared")



async def seed_users(session: AsyncSession):
    users_data = [
        {
            "email": "admin@clothcrm.com",
            "full_name": "Super Administrator",
            "role": UserRole.super_admin,
            "phone": "+998901234567",
        },
        {
            "email": "sales.manager@clothcrm.com",
            "full_name": "Dilnoza Karimova",
            "role": UserRole.sales_manager,
            "phone": "+998901234568",
        },
        {
            "email": "sales.rep@clothcrm.com",
            "full_name": "Jasur Toshmatov",
            "role": UserRole.sales_rep,
            "phone": "+998901234569",
        },
        {
            "email": "warehouse@clothcrm.com",
            "full_name": "Behruz Yusupov",
            "role": UserRole.warehouse_manager,
            "phone": "+998901234570",
        },
        {
            "email": "logistics@clothcrm.com",
            "full_name": "Malika Rakhimova",
            "role": UserRole.logistics_manager,
            "phone": "+998901234571",
        },
        {
            "email": "support@clothcrm.com",
            "full_name": "Nodira Hamidova",
            "role": UserRole.customer_support,
            "phone": "+998901234572",
        },
        {
            "email": "finance@clothcrm.com",
            "full_name": "Aziz Ergashev",
            "role": UserRole.finance_manager,
            "phone": "+998901234573",
        },
    ]
    users = []
    for u in users_data:
        user = User(
            **u,
            hashed_password=get_password_hash("Admin123!"),
            is_active=True,
            is_verified=True,
        )
        session.add(user)
        users.append(user)
    await session.flush()
    print(f"✅ {len(users)} users created (password: Admin123!)")
    return users


async def seed_customers(session: AsyncSession, sales_rep_id: int):
    companies = [
        ("Textile Pro LLC", "Alisher Sobirov"),
        ("Fashion Hub", "Gulnora Yuldasheva"),
        ("Star Clothing", "Sherzod Nazarov"),
        ("Mega Textile", "Feruza Komilov"),
        ("Elite Fashion", "Sarvar Mirzaev"),
        ("Bright Style", "Nilufar Hasanova"),
        ("Royal Cloth", "Doniyor Rahimov"),
        ("Smart Wear", "Zulfiya Umarova"),
        ("Top Textile", "Bobur Xasanov"),
        ("Premium Cloth", "Madina Tursunova"),
        ("City Fashion", "Shuhrat Ergashev"),
        ("Modern Style", "Kamola Yusupova"),
        ("Grand Textile", "Laziz Nazarov"),
        ("Best Wear", "Ozoda Rakhimova"),
        ("Quick Cloth", "Nodir Alimov"),
    ]
    customers = []
    segments = list(CustomerSegment)
    for i, (company, contact) in enumerate(companies):
        c = Customer(
            company_name=company,
            contact_person=contact,
            email=f"info@{company.lower().replace(' ', '')}.uz",
            phone=f"+998{random.randint(90, 99)}{random.randint(1000000, 9999999)}",
            city=random.choice(CITIES),
            country="Uzbekistan",
            address=f"Street {random.randint(1, 100)}, {random.choice(CITIES)}",
            segment=random.choice(segments),
            status=CustomerStatus.active,
            credit_limit=random.choice([5000000, 10000000, 20000000, 50000000]),
            discount_percent=random.choice([0, 5, 10, 15]),
            assigned_to=sales_rep_id,
            created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(30, 365)),
        )
        session.add(c)
        customers.append(c)
    await session.flush()
    print(f"✅ {len(customers)} customers created")
    return customers


async def seed_products(session: AsyncSession):
    products = []
    for i in range(1, 51):
        category = random.choice(CATEGORIES)
        brand = random.choice(BRANDS)
        color = random.choice(COLORS)
        size = random.choice(SIZES)
        purchase_price = random.uniform(50000, 500000)
        selling_price = purchase_price * random.uniform(1.3, 2.5)

        p = Product(
            sku=f"SKU-{i:04d}",
            product_code=f"PRD-{brand[:3].upper()}-{i:04d}",
            name=f"{brand} {category.value.capitalize()} {color} {size}",
            category=category,
            brand=brand,
            size=size,
            color=color,
            material=random.choice(MATERIALS),
            supplier=f"Supplier {random.randint(1, 10)} LLC",
            purchase_price=round(purchase_price, 2),
            selling_price=round(selling_price, 2),
            min_stock_level=random.randint(5, 20),
            is_active=True,
            barcode=f"860{random.randint(100000000, 999999999)}",
            image_urls=[],
            tags=[brand.lower(), category.value, color.lower()],
            created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 180)),
        )
        session.add(p)
        products.append(p)
    await session.flush()
    print(f"✅ {len(products)} products created")
    return products


async def seed_warehouse_and_inventory(session: AsyncSession, products, manager_id: int):
    warehouses = [
        Warehouse(name="Main Warehouse", code="WH-001", city="Tashkent", capacity=10000, manager_id=manager_id),
        Warehouse(name="North Depot", code="WH-002", city="Tashkent", capacity=5000, manager_id=manager_id),
        Warehouse(name="South Storage", code="WH-003", city="Samarkand", capacity=3000, manager_id=manager_id),
    ]
    for wh in warehouses:
        session.add(wh)
    await session.flush()

    for product in products:
        for wh in warehouses[:2]:  # Main warehouses
            qty = random.randint(0, 500)
            inv = Inventory(
                product_id=product.id,
                warehouse_id=wh.id,
                quantity=qty,
                reserved_quantity=random.randint(0, max(0, qty - 10)),
                batch_number=f"BATCH-{random.randint(1000, 9999)}",
                location_code=f"R{random.randint(1, 10)}-S{random.randint(1, 20)}",
            )
            session.add(inv)
    await session.flush()
    print(f"✅ {len(warehouses)} warehouses + inventory records created")
    return warehouses


async def seed_leads(session: AsyncSession, sales_rep_id: int):
    first_names = ["Ahmad", "Bobur", "Camila", "Dilnoza", "Eldor", "Feruza", "Gulsanam"]
    last_names = ["Karimov", "Yusupov", "Toshmatov", "Rakhimova", "Nazarov", "Hasanova"]
    stages = list(LeadStage)

    leads = []
    for i in range(25):
        stage = random.choice(stages)
        lead = Lead(
            title=f"Lead from {random.choice(['Exhibition', 'Website', 'Referral'])}",
            first_name=random.choice(first_names),
            last_name=random.choice(last_names),
            company=f"Company {i + 1}",
            email=f"lead{i}@example.com",
            phone=f"+998{random.randint(90, 99)}{random.randint(1000000, 9999999)}",
            source=random.choice(list(LeadSource)),
            stage=stage,
            score=random.randint(10, 95),
            estimated_value=random.uniform(1000000, 50000000),
            assigned_to=sales_rep_id,
            is_converted=stage == LeadStage.won,
            created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 90)),
        )
        session.add(lead)
        leads.append(lead)
    await session.flush()
    print(f"✅ {len(leads)} leads created")
    return leads


async def seed_orders(session: AsyncSession, customers, products, sales_rep_id: int):
    statuses = list(OrderStatus)
    orders = []
    for i in range(40):
        customer = random.choice(customers)
        status = random.choice(statuses)
        num_items = random.randint(1, 5)
        selected_products = random.sample(products, num_items)

        subtotal = 0
        order_num = f"ORD-{(datetime.now(timezone.utc) - timedelta(days=i)).strftime('%Y%m')}-{i + 1:05d}"
        tax_amount = 0
        total = 0

        order = Order(
            order_number=order_num,
            customer_id=customer.id,
            status=status,
            payment_status=random.choice(list(PaymentStatus)),
            notes="Demo order",
            shipping_address=customer.address,
            created_by=sales_rep_id,
            created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 120)),
        )
        session.add(order)
        await session.flush()

        order_subtotal = 0
        for prod in selected_products:
            qty = random.randint(10, 100)
            price = float(prod.selling_price)
            item_total = qty * price
            order_subtotal += item_total
            item = OrderItem(
                order_id=order.id,
                product_id=prod.id,
                quantity=qty,
                unit_price=price,
                discount_percent=0,
                total_price=item_total,
            )
            session.add(item)

        order.subtotal = order_subtotal
        order.tax_amount = order_subtotal * 0.12
        order.total_amount = order.subtotal + order.tax_amount
        orders.append(order)

    await session.flush()
    print(f"✅ {len(orders)} orders created")
    return orders


async def seed_support_tickets(session: AsyncSession, customers, support_id: int):
    subjects = [
        "Delivery delayed", "Wrong product delivered", "Invoice discrepancy",
        "Product quality issue", "Order cancellation request", "Payment not recorded",
        "Missing items in shipment", "Wrong pricing on invoice",
    ]
    tickets = []
    for i in range(20):
        priority = random.choice(list(TicketPriority))
        sla_hours = {"low": 72, "medium": 24, "high": 8, "critical": 2}
        created = datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30))
        sla_due = created + timedelta(hours=sla_hours[priority])

        ticket = SupportTicket(
            ticket_number=f"TKT-{datetime.now(timezone.utc).strftime('%Y%m')}-{i + 1:05d}",
            customer_id=random.choice(customers).id,
            subject=random.choice(subjects),
            description="Customer reported an issue that needs resolution.",
            status=random.choice(list(TicketStatus)),
            priority=priority,
            category=random.choice(["Delivery", "Invoice", "Product", "Payment"]),
            sla_due_at=sla_due,
            assigned_to=support_id,
            created_by=support_id,
            created_at=created,
        )
        session.add(ticket)
        tickets.append(ticket)
    await session.flush()
    print(f"✅ {len(tickets)} support tickets created")
    return tickets


async def main():
    print("\n🌱 Starting ClothCRM seed script...\n")
    await create_tables()
    await clear_tables()

    async with SessionLocal() as session:
        try:
            users = await seed_users(session)
            # User index: 0=admin, 1=sales_mgr, 2=sales_rep, 3=warehouse_mgr, 4=logistics, 5=support, 6=finance
            sales_rep = users[2]
            warehouse_mgr = users[3]
            support_agent = users[5]

            customers = await seed_customers(session, sales_rep.id)
            products = await seed_products(session)
            await seed_warehouse_and_inventory(session, products, warehouse_mgr.id)
            await seed_leads(session, sales_rep.id)
            await seed_orders(session, customers, products, sales_rep.id)
            await seed_support_tickets(session, customers, support_agent.id)

            await session.commit()
            print("\n🎉 Seed completed successfully!\n")
            print("Demo credentials (all passwords: Admin123!):")
            print("  admin@clothcrm.com          → Super Admin")
            print("  sales.manager@clothcrm.com  → Sales Manager")
            print("  sales.rep@clothcrm.com      → Sales Representative")
            print("  warehouse@clothcrm.com      → Warehouse Manager")
            print("  logistics@clothcrm.com      → Logistics Manager")
            print("  support@clothcrm.com        → Customer Support")
            print("  finance@clothcrm.com        → Finance Manager\n")

        except Exception as e:
            await session.rollback()
            print(f"❌ Seed failed: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(main())
