import { type Sql } from 'postgres';

const DEFAULT_PRODUCT_IMAGE_PLACEHOLDER = '/images/2023-05-11.webp';
const MAX_PRODUCTS_LIMIT = 1000;

function resolveProductImage(row: any): string {
    const preferred = typeof row.image_url === 'string' ? row.image_url.trim() : '';
    const legacy = typeof row.image === 'string' ? row.image.trim() : '';
    const candidate = preferred || legacy;

    if (!candidate) {
        return DEFAULT_PRODUCT_IMAGE_PLACEHOLDER;
    }

    const isLikelyUrl = candidate.startsWith('http://') || candidate.startsWith('https://');
    const isLikelyPublicPath = candidate.startsWith('/');
    if (!isLikelyUrl && !isLikelyPublicPath) {
        return DEFAULT_PRODUCT_IMAGE_PLACEHOLDER;
    }

    return candidate;
}

function addParam(values: Array<string | number | boolean | null>, value: string | number | boolean | null): string {
    values.push(value);
    return `$${values.length}`;
}

export function mapProductRow(row: any) {
    const originalPrice = Number(row.original_price);
    const discountPercentage = Number(row.discount_percentage);

    return {
        id: row.id,
        name: row.name,
        brand: row.brand,
        flavor: row.flavor,
        nicotine: row.nicotine,
        price: Number(row.price),
        originalPrice: Number.isFinite(originalPrice) && originalPrice > 0 ? originalPrice : undefined,
        discountPercentage: Number.isFinite(discountPercentage) && discountPercentage > 0 ? discountPercentage : undefined,
        rating: Number(row.rating),
        reviews: Number(row.reviews),
        image: resolveProductImage(row),
        category: row.category,
        description: row.description,
        stockQty: Number(row.stock_qty),
        isExpressDelivery: Boolean(row.is_express_delivery),
        isBestSeller: Boolean(row.is_bestseller),
        isNewArrival: Boolean(row.is_new_arrival),
        vendorId: row.vendor_id ?? null,
        vendor_id: row.vendor_id ?? null,
        storeId: row.store_id ?? null,
        store_id: row.store_id ?? null,
        created_at: row.created_at,
    };
}

export async function findUserById(sql: Sql, userId: number) {
    const rows = await sql<any[]>`
        SELECT id, email, name, role, store_id, age_verified, verification_status, created_at
        FROM users
        WHERE id = ${userId}
        LIMIT 1
    `;
    return rows[0] ?? null;
}

export async function findUserByEmail(sql: Sql, email: string) {
    const rows = await sql<any[]>`
        SELECT *
        FROM users
        WHERE email = ${email}
        LIMIT 1
    `;
    return rows[0] ?? null;
}

export async function getUserOrders(sql: Sql, userId: number) {
    const rows = await sql<any[]>`
        SELECT
            o.id AS order_id,
            o.status,
            o.total_amount,
            o.shipping_address,
            o.created_at AS order_created_at,
            oi.id AS order_item_id,
            oi.quantity,
            oi.price_at_time,
            p.*
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        JOIN products p ON p.id = oi.product_id
        WHERE o.user_id = ${userId}
        ORDER BY o.created_at DESC, oi.id ASC
    `;

    const ordersMap = new Map<number, {
        id: number;
        status: string;
        totalAmount: number;
        shippingAddress: string;
        createdAt: string;
        items: Array<{ id: number; product: ReturnType<typeof mapProductRow>; quantity: number; priceAtTime: number }>;
    }>();

    for (const row of rows) {
        const orderId = Number(row.order_id);
        const order = ordersMap.get(orderId);
        const product = mapProductRow(row);
        const item = {
            id: Number(row.order_item_id),
            product,
            quantity: Number(row.quantity),
            priceAtTime: Number(row.price_at_time),
        };

        if (!order) {
            ordersMap.set(orderId, {
                id: orderId,
                status: row.status,
                totalAmount: Number(row.total_amount),
                shippingAddress: row.shipping_address,
                createdAt: row.order_created_at,
                items: [item],
            });
            continue;
        }

        order.items.push(item);
    }

    return Array.from(ordersMap.values());
}

export async function getUserSavedItems(sql: Sql, userId: number) {
    const rows = await sql<any[]>`
        SELECT p.*
        FROM saved_items si
        JOIN products p ON p.id = si.product_id
        WHERE si.user_id = ${userId}
        ORDER BY si.created_at DESC
    `;
    return rows.map(mapProductRow);
}

export async function addSavedItem(sql: Sql, userId: number, productId: number) {
    await sql`
        INSERT INTO saved_items (user_id, product_id)
        VALUES (${userId}, ${productId})
        ON CONFLICT (user_id, product_id) DO NOTHING
    `;
}

export async function removeSavedItem(sql: Sql, userId: number, productId: number) {
    await sql`
        DELETE FROM saved_items
        WHERE user_id = ${userId}
          AND product_id = ${productId}
    `;
}

export async function storeExists(sql: Sql, storeId: number) {
    const rows = await sql<any[]>`SELECT id FROM stores WHERE id = ${storeId} LIMIT 1`;
    return Boolean(rows[0]);
}

export async function listMarketplaceProducts(
    sql: Sql,
    filters: { search?: string; filter?: string; category?: string; limit?: number }
) {
    const clauses = ['1=1'];
    const values: Array<string | number | boolean | null> = [];

    if (filters.search) {
        const like = `%${filters.search}%`;
        const p1 = addParam(values, like);
        const p2 = addParam(values, like);
        const p3 = addParam(values, like);
        clauses.push(`(name ILIKE ${p1} OR brand ILIKE ${p2} OR flavor ILIKE ${p3})`);
    }

    if (filters.category) {
        const categoryParam = addParam(values, filters.category);
        clauses.push(`LOWER(category) = LOWER(${categoryParam})`);
    }

    if (filters.filter === 'bestsellers') {
        clauses.push('is_bestseller = TRUE');
    } else if (filters.filter === 'newarrivals') {
        clauses.push('is_new_arrival = TRUE');
    } else if (filters.filter === 'express') {
        clauses.push('is_express_delivery = TRUE');
    }

    let limitClause = '';
    if (
        typeof filters.limit === 'number'
        && Number.isInteger(filters.limit)
        && filters.limit > 0
        && filters.limit <= MAX_PRODUCTS_LIMIT
    ) {
        const limitParam = addParam(values, filters.limit);
        limitClause = ` LIMIT ${limitParam}`;
    }

    const rows = await sql.unsafe<any[]>(
        `SELECT * FROM products WHERE ${clauses.join(' AND ')} ORDER BY is_bestseller DESC, rating DESC, reviews DESC${limitClause}`,
        values,
    );

    return rows.map(mapProductRow);
}

export async function listHomepageMasterListings(sql: Sql, limit = 8) {
    const parsedLimit = Number(limit);
    const safeLimit = Number.isInteger(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 24)
        : 8;

    const rows = await sql<any[]>`
        WITH ranked_groups AS (
            SELECT
                brand,
                category,
                COALESCE(NULLIF(TRIM(SPLIT_PART(name, ' - ', 1)), ''), name) AS parent_name,
                COUNT(*)::int AS flavor_count,
                MAX(rating)::float AS top_rating,
                SUM(reviews)::int AS total_reviews,
                CASE
                    WHEN LOWER(brand) IN ('blues', 'zyns', 'hydroxie (7-oh)') THEN 0
                    ELSE 1
                END AS homepage_priority
            FROM products
            WHERE stock_qty > 0
            GROUP BY brand, category, COALESCE(NULLIF(TRIM(SPLIT_PART(name, ' - ', 1)), ''), name)
            ORDER BY homepage_priority ASC, flavor_count DESC, top_rating DESC, total_reviews DESC, parent_name ASC
            LIMIT ${safeLimit}
        )
        SELECT p.*, rg.parent_name
        FROM products p
        INNER JOIN ranked_groups rg
            ON rg.brand = p.brand
            AND rg.category = p.category
            AND rg.parent_name = COALESCE(NULLIF(TRIM(SPLIT_PART(p.name, ' - ', 1)), ''), p.name)
        ORDER BY rg.homepage_priority ASC, rg.flavor_count DESC, rg.top_rating DESC, rg.total_reviews DESC, rg.parent_name ASC, p.price ASC, p.rating DESC, p.reviews DESC
    `;

    const groupMap = new Map<string, {
        key: string;
        parentName: string;
        brand: string;
        category: string;
        variants: ReturnType<typeof mapProductRow>[];
    }>();

    for (const row of rows) {
        const parentName = typeof row.parent_name === 'string' && row.parent_name.trim()
            ? row.parent_name.trim()
            : (typeof row.name === 'string' ? row.name.trim() : 'Unnamed Product');
        const key = `${String(row.category || '').toLowerCase()}::${String(row.brand || '').toLowerCase()}::${parentName.toLowerCase()}`;
        const mappedVariant = mapProductRow(row);
        const existing = groupMap.get(key);

        if (!existing) {
            groupMap.set(key, {
                key,
                parentName,
                brand: row.brand,
                category: row.category,
                variants: [mappedVariant],
            });
            continue;
        }

        groupMap.set(key, {
            ...existing,
            variants: [...existing.variants, mappedVariant],
        });
    }

    return Array.from(groupMap.values()).map((group) => ({
        ...group,
        variants: [...group.variants].sort((a, b) => a.price - b.price),
    }));
}

export async function getProductById(sql: Sql, productId: number) {
    const rows = await sql<any[]>`SELECT * FROM products WHERE id = ${productId} LIMIT 1`;
    return rows[0] ? mapProductRow(rows[0]) : null;
}

export async function checkoutOrder(
    sql: Sql,
    userId: number,
    items: Array<{ productId: number; quantity: number }>,
    shippingAddress: string,
) {
    return sql.begin(async (tx) => {
        let total = 0;
        const processedItems: Array<{ productId: number; quantity: number; price: number }> = [];
        let orderStoreId: number | null = null;

        for (const item of items) {
            const productRows = await tx.unsafe<any[]>(
                'SELECT id, price, stock_qty, store_id FROM products WHERE id = $1 FOR UPDATE',
                [item.productId]
            );
            const product = productRows[0];
            if (!product) {
                throw new Error(`Product ${item.productId} not found`);
            }
            if (Number(product.stock_qty) < item.quantity) {
                throw new Error(`Insufficient stock for product ${item.productId}`);
            }
            if (!product.store_id) {
                throw new Error(`Product ${item.productId} is not linked to a store`);
            }

            if (orderStoreId === null) {
                orderStoreId = Number(product.store_id);
            } else if (orderStoreId !== Number(product.store_id)) {
                throw new Error('Checkout across multiple stores is not supported in one order');
            }

            await tx.unsafe('UPDATE products SET stock_qty = stock_qty - $1 WHERE id = $2', [item.quantity, item.productId]);

            const unitPrice = Number(product.price);
            total += unitPrice * item.quantity;
            processedItems.push({ productId: Number(product.id), quantity: item.quantity, price: unitPrice });
        }

        if (!orderStoreId) {
            throw new Error('Order store could not be determined');
        }

        const orderRows = await tx.unsafe<any[]>(
            "INSERT INTO orders (user_id, store_id, status, total_amount, shipping_address) VALUES ($1, $2, 'processing', $3, $4) RETURNING id",
            [userId, orderStoreId, total, shippingAddress]
        );
        const orderId = Number(orderRows[0].id);

        for (const item of processedItems) {
            await tx.unsafe(
                'INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES ($1, $2, $3, $4)',
                [orderId, item.productId, item.quantity, item.price]
            );
        }

        return orderId;
    });
}

export async function calculateOrderTotal(
    sql: Sql,
    items: Array<{ productId: number; quantity: number }>,
    deliveryMethod: 'standard' | 'express'
) {
    let subtotal = 0;
    for (const item of items) {
        const productRows = await sql<any[]>`
            SELECT price, stock_qty FROM products WHERE id = ${item.productId}
        `;
        const product = productRows[0];
        if (!product) {
            throw new Error(`Product ${item.productId} not found`);
        }
        if (Number(product.stock_qty) < item.quantity) {
            throw new Error(`Insufficient stock for product ${item.productId}`);
        }

        const unitPrice = Number(product.price);
        subtotal += unitPrice * item.quantity;
    }
    const deliveryFee = deliveryMethod === 'express' ? 5.99 : 0;
    return subtotal + deliveryFee;
}

export async function getAdminStats(sql: Sql) {
    const [rows] = await sql<any[]>`
        SELECT
            (SELECT COUNT(*)::int FROM users) AS total_users,
            (SELECT COUNT(*)::int FROM users WHERE role = 'vendor') AS total_vendors,
            (SELECT COALESCE(SUM(total_amount), 0)::float FROM orders WHERE status != 'cancelled') AS total_sales,
            (SELECT COUNT(*)::int FROM products) AS total_products,
            (SELECT COUNT(*)::int FROM users WHERE verification_status = 'pending') AS pending_verifications
    `;
    return {
        totalUsers: Number(rows.total_users ?? 0),
        totalVendors: Number(rows.total_vendors ?? 0),
        totalSales: Number(rows.total_sales ?? 0),
        totalProducts: Number(rows.total_products ?? 0),
        pendingVerifications: Number(rows.pending_verifications ?? 0),
    };
}

export async function listAdminUsers(sql: Sql) {
    const rows = await sql<any[]>`
        SELECT id, email, name, role, store_id, verification_status, created_at
        FROM users
        ORDER BY created_at DESC
    `;

    return rows.map((user) => ({
        ...user,
        role: user.role === 'vendor' && user.store_id ? 'store_manager' : user.role,
        storeId: user.store_id ?? null,
    }));
}

export async function updateUserVerification(sql: Sql, userId: number, status: string) {
    await sql`UPDATE users SET verification_status = ${status} WHERE id = ${userId}`;
}

export async function updateUserRole(sql: Sql, userId: number, normalizedRole: string) {
    if (normalizedRole === 'vendor') {
        const rows = await sql<any[]>`SELECT store_id FROM users WHERE id = ${userId} LIMIT 1`;
        const user = rows[0];
        if (!user) {
            throw new Error('User not found');
        }
        if (!user.store_id) {
            throw new Error('Cannot promote to store_manager without assigning a store.');
        }
    }

    await sql`UPDATE users SET role = ${normalizedRole} WHERE id = ${userId}`;
}

export async function listAdminProducts(sql: Sql, storeId?: number | null) {
    const rows = storeId
        ? await sql<any[]>`SELECT * FROM products WHERE store_id = ${storeId} ORDER BY created_at DESC`
        : await sql<any[]>`SELECT * FROM products ORDER BY created_at DESC`;

    return rows.map(mapProductRow);
}

export async function listAdminOrders(sql: Sql, storeId?: number | null) {
    const rows = storeId
        ? await sql<any[]>`
            SELECT o.*, u.name AS customer_name
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.store_id = ${storeId}
            ORDER BY o.created_at DESC
        `
        : await sql<any[]>`
            SELECT o.*, u.name AS customer_name
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `;

    return rows.map((order) => ({
        ...order,
        total_amount: Number(order.total_amount),
        storeId: order.store_id ?? null,
    }));
}

export async function listAdminStores(sql: Sql) {
    const rows = await sql<any[]>`
        SELECT
            s.id,
            s.name,
            s.address,
            s.owner_id,
            u.name AS owner_name,
            u.email AS owner_email,
            COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total_amount ELSE 0 END), 0)::float AS total_sales,
            COUNT(DISTINCT o.id)::int AS total_orders
        FROM stores s
        LEFT JOIN users u ON u.id = s.owner_id
        LEFT JOIN orders o ON o.store_id = s.id
        GROUP BY s.id, s.name, s.address, s.owner_id, u.name, u.email
        ORDER BY s.created_at DESC
    `;

    return rows.map((store) => ({
        ...store,
        total_sales: Number(store.total_sales ?? 0),
        total_orders: Number(store.total_orders ?? 0),
    }));
}

export async function getVendorStats(sql: Sql, storeId?: number | null) {
    const rows = storeId
        ? await sql<any[]>`
            SELECT
                (SELECT COALESCE(SUM(total_amount), 0)::float FROM orders WHERE created_at::date = CURRENT_DATE AND status != 'cancelled' AND store_id = ${storeId}) AS today_sales,
                (SELECT COUNT(*)::int FROM orders WHERE status IN ('pending', 'processing') AND store_id = ${storeId}) AS open_orders,
                (SELECT COUNT(*)::int FROM products WHERE stock_qty < 10 AND store_id = ${storeId}) AS low_stock_items,
                (SELECT COALESCE(SUM(total_amount), 0)::float FROM orders WHERE status != 'cancelled' AND store_id = ${storeId}) AS total_earnings,
                (SELECT COALESCE(AVG(rating), 4.5)::float FROM products WHERE store_id = ${storeId}) AS avg_rating
        `
        : await sql<any[]>`
            SELECT
                (SELECT COALESCE(SUM(total_amount), 0)::float FROM orders WHERE created_at::date = CURRENT_DATE AND status != 'cancelled') AS today_sales,
                (SELECT COUNT(*)::int FROM orders WHERE status IN ('pending', 'processing')) AS open_orders,
                (SELECT COUNT(*)::int FROM products WHERE stock_qty < 10) AS low_stock_items,
                (SELECT COALESCE(SUM(total_amount), 0)::float FROM orders WHERE status != 'cancelled') AS total_earnings,
                (SELECT COALESCE(AVG(rating), 4.5)::float FROM products) AS avg_rating
        `;

    const row = rows[0] ?? {};
    return {
        todaySales: Number(row.today_sales ?? 0),
        openOrders: Number(row.open_orders ?? 0),
        lowStockItems: Number(row.low_stock_items ?? 0),
        totalEarnings: Number(row.total_earnings ?? 0),
        avgRating: Number(Number(row.avg_rating ?? 4.5).toFixed(1)),
    };
}

export async function listVendorOrders(sql: Sql, storeId?: number | null) {
    const rows = storeId
        ? await sql<any[]>`
            SELECT o.id, o.status, o.total_amount, o.created_at, o.store_id, u.name AS customer_name, u.email AS customer_email
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.store_id = ${storeId}
            ORDER BY o.created_at DESC
            LIMIT 50
        `
        : await sql<any[]>`
            SELECT o.id, o.status, o.total_amount, o.created_at, o.store_id, u.name AS customer_name, u.email AS customer_email
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
            LIMIT 50
        `;

    return rows.map((order) => ({
        ...order,
        total_amount: Number(order.total_amount),
        storeId: order.store_id ?? null,
    }));
}

export async function updateVendorOrderStatus(sql: Sql, orderId: number, status: string, storeId?: number | null) {
    if (storeId) {
        await sql`UPDATE orders SET status = ${status} WHERE id = ${orderId} AND store_id = ${storeId}`;
        return;
    }

    await sql`UPDATE orders SET status = ${status} WHERE id = ${orderId}`;
}

export async function listVendorProducts(sql: Sql, storeId?: number | null) {
    const rows = storeId
        ? await sql<any[]>`SELECT * FROM products WHERE store_id = ${storeId}`
        : await sql<any[]>`SELECT * FROM products`;

    return rows.map(mapProductRow);
}

export async function createVendorProduct(
    sql: Sql,
    input: {
        name: string;
        brand: string;
        flavor: string;
        nicotine: string;
        price: number;
        image: string;
        category: string;
        description: string;
        stockQty: number;
        vendorId: number;
        storeId: number;
    },
) {
    const rows = await sql<any[]>`
        INSERT INTO products (
            name, brand, flavor, nicotine, price, image, category, description, stock_qty, vendor_id, store_id,
            rating, reviews, is_express_delivery, is_bestseller, is_new_arrival
        ) VALUES (
            ${input.name}, ${input.brand}, ${input.flavor}, ${input.nicotine}, ${input.price}, ${input.image}, ${input.category},
            ${input.description}, ${input.stockQty}, ${input.vendorId}, ${input.storeId}, 0, 0, FALSE, FALSE, FALSE
        )
        RETURNING id
    `;

    return Number(rows[0].id);
}

export async function updateVendorProduct(
    sql: Sql,
    productId: number,
    input: {
        name: string;
        brand: string;
        flavor: string;
        nicotine: string;
        price: number;
        category: string;
        description: string;
        stockQty: number;
    },
    storeId?: number | null,
) {
    if (storeId) {
        await sql`
            UPDATE products
            SET name = ${input.name}, brand = ${input.brand}, flavor = ${input.flavor}, nicotine = ${input.nicotine},
                price = ${input.price}, category = ${input.category}, description = ${input.description}, stock_qty = ${input.stockQty}
            WHERE id = ${productId} AND store_id = ${storeId}
        `;
        return;
    }

    await sql`
        UPDATE products
        SET name = ${input.name}, brand = ${input.brand}, flavor = ${input.flavor}, nicotine = ${input.nicotine},
            price = ${input.price}, category = ${input.category}, description = ${input.description}, stock_qty = ${input.stockQty}
        WHERE id = ${productId}
    `;
}

export async function deleteVendorProduct(sql: Sql, productId: number, storeId?: number | null) {
    if (storeId) {
        await sql`DELETE FROM products WHERE id = ${productId} AND store_id = ${storeId}`;
        return;
    }

    await sql`DELETE FROM products WHERE id = ${productId}`;
}

// ─── CART ─────────────────────────────────────────────────────────────────────

export async function getCartItems(sql: Sql, userId: number) {
    const rows = await sql<any[]>`
        SELECT ci.id AS cart_item_id, ci.quantity, p.*
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ${userId}
        ORDER BY ci.created_at ASC
    `;
    return rows.map((row) => ({
        cartItemId: row.cart_item_id,
        quantity: Number(row.quantity),
        product: mapProductRow(row),
    }));
}

export async function upsertCartItem(sql: Sql, userId: number, productId: number, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error('Quantity must be a positive integer');
    }
    await sql`
        INSERT INTO cart_items (user_id, product_id, quantity)
        VALUES (${userId}, ${productId}, ${quantity})
        ON CONFLICT (user_id, product_id)
        DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
    `;
}

export async function setCartItemQuantity(sql: Sql, userId: number, productId: number, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error('Quantity must be a positive integer');
    }
    await sql`
        UPDATE cart_items SET quantity = ${quantity}
        WHERE user_id = ${userId} AND product_id = ${productId}
    `;
}

export async function removeCartItem(sql: Sql, userId: number, productId: number) {
    await sql`DELETE FROM cart_items WHERE user_id = ${userId} AND product_id = ${productId}`;
}

export async function clearUserCart(sql: Sql, userId: number) {
    await sql`DELETE FROM cart_items WHERE user_id = ${userId}`;
}

// ─── OTP ──────────────────────────────────────────────────────────────────────

export async function createOtp(sql: Sql, email: string, code: string, expiresAt: Date) {
    // Invalidate any existing unused OTPs for this email first
    await sql`UPDATE email_otps SET used = TRUE WHERE email = ${email} AND used = FALSE`;
    await sql`
        INSERT INTO email_otps (email, code, expires_at)
        VALUES (${email}, ${code}, ${expiresAt.toISOString()})
    `;
}

export async function getValidOtp(sql: Sql, email: string, code: string) {
    const rows = await sql<any[]>`
        SELECT id FROM email_otps
        WHERE email = ${email}
          AND code = ${code}
          AND used = FALSE
          AND expires_at > NOW()
        LIMIT 1
    `;
    return rows[0] ?? null;
}

export async function markOtpUsed(sql: Sql, otpId: number) {
    await sql`UPDATE email_otps SET used = TRUE WHERE id = ${otpId}`;
}

export async function getOrderWithUser(sql: Sql, orderId: number) {
    const rows = await sql<any[]>`
        SELECT o.id, o.total_amount, o.status, u.email, u.name
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = ${orderId}
        LIMIT 1
    `;
    return rows[0] ?? null;
}
