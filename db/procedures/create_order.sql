CREATE OR REPLACE PROCEDURE create_order (
    p_user_id IN VARCHAR2,
    p_cart_id IN VARCHAR2,
    p_shipping_address IN VARCHAR2,
    p_payment_mode IN VARCHAR2 DEFAULT 'cod',
    p_total_amount IN NUMBER,  -- Added parameter for total amount
    p_order_id OUT NUMBER
) IS
BEGIN
    -- Ensure valid payment mode
    IF p_payment_mode NOT IN ('cod', 'online') THEN
        RAISE_APPLICATION_ERROR(-20001, 'Invalid payment mode. Allowed values are "cod" and "online".');
    END IF;

    -- Insert the order with total_amount passed from frontend
    INSERT INTO orders (user_id, cart_id, shipping_address, payment_mode, total_amount)
    VALUES (p_user_id, p_cart_id, p_shipping_address, p_payment_mode, p_total_amount)
    RETURNING id INTO p_order_id;

    COMMIT;

    DBMS_OUTPUT.PUT_LINE('Order created for user: ' || p_user_id || ' with total amount: ' || p_total_amount);
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Error occurred: ' || SQLERRM);
        RAISE;
END;
