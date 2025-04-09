-- Declare a bind variable to hold the REF CURSOR
VARIABLE orders REFCURSOR;

-- Execute the procedure, passing the store ID and binding the REF CURSOR
EXEC C##ecommerce.get_orders_by_store('67f12d7ee4ff63573ecc3ab7', :orders);

-- Display the contents of the REF CURSOR
PRINT orders;
