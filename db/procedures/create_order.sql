-- create_order.sql

CREATE OR REPLACE PROCEDURE create_order (
    p_user_id IN VARCHAR2,
    p_cart_id IN VARCHAR2,
    p_shipping_address IN VARCHAR2,
    p_payment_mode IN VARCHAR2 DEFAULT 'cod'
) IS
BEGIN
    -- Insert a new order into the orders table
    INSERT INTO orders (user_id, cart_id, shipping_address, payment_mode)
    VALUES (p_user_id, p_cart_id, p_shipping_address, p_payment_mode);
    
    -- Commit the transaction to ensure the order is saved
    COMMIT;
    
    DBMS_OUTPUT.PUT_LINE('Order successfully created for user: ' || p_user_id || ' with cart: ' || p_cart_id);
EXCEPTION
    WHEN OTHERS THEN
        -- Handle any errors that occur during the insert operation
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Error occurred: ' || SQLERRM);
        RAISE;
END;
/
