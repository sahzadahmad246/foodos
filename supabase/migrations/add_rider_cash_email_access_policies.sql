-- Allow rider cash pages to work when rider identity is linked by email
-- (some rider records may not have user_id populated)

CREATE POLICY "Riders can view own cash ledger by email" ON rider_cash_ledger
  FOR SELECT USING (
    rider_id IN (SELECT id FROM riders WHERE email = (auth.jwt() ->> 'email'))
  );

CREATE POLICY "Riders can view deposit requests by email" ON rider_cash_deposit_requests
  FOR SELECT USING (
    rider_id IN (SELECT id FROM riders WHERE email = (auth.jwt() ->> 'email'))
  );

CREATE POLICY "Riders can cancel pending requests by email" ON rider_cash_deposit_requests
  FOR UPDATE USING (
    rider_id IN (SELECT id FROM riders WHERE email = (auth.jwt() ->> 'email'))
    AND status = 'pending'
  )
  WITH CHECK (
    rider_id IN (SELECT id FROM riders WHERE email = (auth.jwt() ->> 'email'))
    AND status = 'cancelled'
  );
