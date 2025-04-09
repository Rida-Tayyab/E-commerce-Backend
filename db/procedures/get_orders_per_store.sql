CREATE OR REPLACE PROCEDURE get_orders_by_store (
    p_store_id IN VARCHAR2,
    p_orders OUT SYS_REFCURSOR
) IS
BEGIN
    -- Open a cursor to fetch orders associated with the store from the store_orders table only
    OPEN p_orders FOR
    SELECT s.order_id,
           s.store_id,
           s.status AS store_status,
           s.payment_amount,
           s.updated_at
      FROM store_orders s
     WHERE s.store_id = p_store_id;

    -- No need for fetch and dbms_output here; just open the cursor and let it be processed
EXCEPTION
    WHEN OTHERS THEN
        -- Handle exceptions by rolling back and raising an error
        ROLLBACK;
        RAISE;
END;
