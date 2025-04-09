-- get_order_by_user.sql

CREATE OR REPLACE PROCEDURE get_order_by_user (
    p_user_id IN VARCHAR2
) IS
BEGIN
    -- Query to fetch orders for the user
    FOR order_rec IN (
        SELECT * FROM orders WHERE user_id = p_user_id
    ) LOOP
        DBMS_OUTPUT.PUT_LINE('Order ID: ' || order_rec.id || ', Shipping Address: ' || order_rec.shipping_address || ', Status: ' || order_rec.status);
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error occurred: ' || SQLERRM);
        RAISE;
END;
/
