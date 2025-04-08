-- delete_order.sql

CREATE OR REPLACE PROCEDURE delete_order (
    p_order_id IN NUMBER
) IS
BEGIN
    -- Delete the order from the orders table
    DELETE FROM orders WHERE id = p_order_id;
    
    -- Commit the transaction
    COMMIT;
    
    DBMS_OUTPUT.PUT_LINE('Order successfully deleted with ID: ' || p_order_id);
EXCEPTION
    WHEN OTHERS THEN
        -- Handle any errors
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Error occurred: ' || SQLERRM);
        RAISE;
END;
/
