CREATE OR REPLACE PROCEDURE get_orders_by_user (
    p_user_id IN VARCHAR2,
    p_orders OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_orders FOR
        SELECT
            id AS order_id,
            status,
            shipping_address,
            cart_id,
            created_at,
            updated_at,
            payment_mode
        FROM
            orders
        WHERE
            user_id = p_user_id
        ORDER BY
            created_at DESC;
END;
/
Select * from orders;