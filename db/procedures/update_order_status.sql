-- update_order_status.sql

CREATE OR REPLACE PROCEDURE update_order_status (
    p_order_id IN NUMBER,
    p_status IN VARCHAR2
) IS
BEGIN
    -- Validate the status
    IF p_status NOT IN ('pending', 'shipped', 'delivered') THEN
        RAISE_APPLICATION_ERROR(-20001, 'Invalid status');
    END IF;
    
    -- Update the order status
    UPDATE orders
    SET status = p_status, updated_at = CURRENT_TIMESTAMP
    WHERE id = p_order_id;
    
    -- Commit the transaction
    COMMIT;
    
    DBMS_OUTPUT.PUT_LINE('Order status updated to: ' || p_status);
EXCEPTION
    WHEN OTHERS THEN
        -- Handle errors
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Error occurred: ' || SQLERRM);
        RAISE;
END;
/
