CREATE OR REPLACE PROCEDURE get_orders_by_store (
    p_store_id IN VARCHAR2,
    p_orders OUT SYS_REFCURSOR
) IS
BEGIN
    -- Open a cursor to fetch orders associated with the store from the store_orders table
    OPEN p_orders FOR
    SELECT s.order_id,
           s.store_id,
           s.status AS store_status,
           s.payment_amount,
           s.updated_at AS store_updated_at, -- Fetching updated_at from store_orders
           o.user_id,
           o.cart_id,
           o.shipping_address,
           o.created_at,
           o.updated_at AS order_updated_at, -- Fetching updated_at from orders
           o.status AS order_status,
           o.payment_mode,
           o.total_amount
      FROM store_orders s
           JOIN orders o ON s.order_id = o.id
     WHERE s.store_id = p_store_id;

EXCEPTION
    WHEN OTHERS THEN
        -- Handle exceptions by rolling back and raising an error
        ROLLBACK;
        RAISE;
END;
