-- Seed data for stays functionality
-- This seed script assumes you have at least one user in your auth.users table

-- Get a user ID to use as the host (modify this if needed)
DO $$
DECLARE
    host_user_id UUID;
BEGIN
    -- Get the first user from the auth.users table to use as a host
    SELECT id INTO host_user_id FROM auth.users LIMIT 1;

    -- If no user exists, display a message
    IF host_user_id IS NULL THEN
        RAISE NOTICE 'No users found in auth.users table. Please create a user first.';
        RETURN;
    END IF;

    -- Create stay entries
    INSERT INTO public.stays (
        host_id, 
        title, 
        description, 
        price_per_night, 
        bedrooms, 
        beds, 
        bathrooms, 
        max_guests, 
        amenities, 
        property_type, 
        location, 
        zipcode, 
        latitude, 
        longitude, 
        is_featured, 
        status
    ) VALUES
    (
        host_user_id,
        'Luxury Beachfront Villa',
        'Spacious villa with private beach access, pool, and stunning ocean views. Perfect for a family getaway or a romantic retreat. Enjoy the sunset from your private terrace.',
        249.00,
        3,
        4,
        2,
        8,
        ARRAY['Wi-Fi', 'Pool', 'Kitchen', 'Free parking', 'Beach access', 'Air conditioning'],
        'house',
        'Miami Beach, FL',
        '33139',
        25.790700,
        -80.130000,
        TRUE,
        'published'
    ),
    (
        host_user_id,
        'Mountain Retreat Cabin',
        'Cozy cabin surrounded by pine forest with hiking trails and mountain views. The perfect place to disconnect and enjoy nature. Includes a hot tub on the deck.',
        179.00,
        2,
        3,
        1,
        6,
        ARRAY['Wi-Fi', 'Fireplace', 'Hot tub', 'Kitchen', 'Free parking', 'Pets allowed'],
        'cabin',
        'Asheville, NC',
        '28801',
        35.595100,
        -82.551500,
        TRUE,
        'published'
    ),
    (
        host_user_id,
        'Modern Downtown Loft',
        'Stylish loft in the heart of the city, walking distance to restaurants and attractions. Modern amenities and contemporary design make this an ideal city escape.',
        155.00,
        1,
        1,
        1,
        2,
        ARRAY['Wi-Fi', 'Air conditioning', 'Kitchen', 'Washer/Dryer', 'Gym access', 'Doorman'],
        'apartment',
        'Chicago, IL',
        '60601',
        41.878100,
        -87.629800,
        TRUE,
        'published'
    ),
    (
        host_user_id,
        'Cozy Private Room in Shared House',
        'Comfortable private room in a shared house with access to common areas. Great for solo travelers or couples looking for an affordable option.',
        75.00,
        1,
        1,
        1,
        2,
        ARRAY['Wi-Fi', 'Kitchen access', 'Laundry', 'Backyard', 'Street parking'],
        'room',
        'Portland, OR',
        '97205',
        45.515200,
        -122.678400,
        FALSE,
        'published'
    ),
    (
        host_user_id,
        'Charming Cottage with Garden',
        'Quaint cottage with a beautiful garden and outdoor seating area. Close to local attractions but secluded enough for peace and quiet.',
        120.00,
        2,
        2,
        1,
        4,
        ARRAY['Wi-Fi', 'Garden', 'Kitchen', 'Free parking', 'BBQ grill', 'Fire pit'],
        'cottage',
        'Savannah, GA',
        '31401',
        32.083500,
        -81.099800,
        FALSE,
        'published'
    );

    -- Add stay images
    WITH stay_data AS (
        SELECT id, title FROM public.stays ORDER BY id
    )
    INSERT INTO public.stay_images (stay_id, url, display_order)
    SELECT 
        s.id, 
        '/images/stays/' || 
        CASE 
            WHEN position('Beachfront' IN s.title) > 0 THEN 'beach-villa' 
            WHEN position('Mountain' IN s.title) > 0 THEN 'mountain-cabin'
            WHEN position('Loft' IN s.title) > 0 THEN 'city-loft'
            WHEN position('Private Room' IN s.title) > 0 THEN 'private-room'
            WHEN position('Cottage' IN s.title) > 0 THEN 'cottage'
            ELSE 'placeholder-stay'
        END || '.jpg',
        0
    FROM stay_data s
    UNION ALL
    SELECT 
        s.id, 
        '/images/stays/' || 
        CASE 
            WHEN position('Beachfront' IN s.title) > 0 THEN 'beach-villa-2' 
            WHEN position('Mountain' IN s.title) > 0 THEN 'mountain-cabin-2'
            WHEN position('Loft' IN s.title) > 0 THEN 'city-loft-2'
            WHEN position('Private Room' IN s.title) > 0 THEN 'private-room-2'
            WHEN position('Cottage' IN s.title) > 0 THEN 'cottage-2'
            ELSE 'placeholder-stay-2'
        END || '.jpg',
        1
    FROM stay_data s
    UNION ALL
    SELECT 
        s.id, 
        '/images/stays/' || 
        CASE 
            WHEN position('Beachfront' IN s.title) > 0 THEN 'beach-villa-3' 
            WHEN position('Mountain' IN s.title) > 0 THEN 'mountain-cabin-3'
            WHEN position('Loft' IN s.title) > 0 THEN 'city-loft-3'
            WHEN position('Cottage' IN s.title) > 0 THEN 'cottage-3'
            ELSE 'placeholder-stay-3'
        END || '.jpg',
        2
    FROM stay_data s
    WHERE s.title NOT LIKE '%Private Room%';  -- Private room only has 2 images

    -- Seed availability data for the next 30 days
    WITH dates AS (
        SELECT generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', INTERVAL '1 day')::date AS date
    ),
    stays_to_update AS (
        SELECT id, price_per_night FROM public.stays
    ),
    date_stay_combinations AS (
        SELECT 
            s.id AS stay_id,
            d.date,
            s.price_per_night AS base_price
        FROM stays_to_update s
        CROSS JOIN dates d
    )
    INSERT INTO public.stay_availability (stay_id, date, price, is_available)
    SELECT
        stay_id,
        date,
        CASE
            -- Higher prices on weekends (Friday, Saturday)
            WHEN EXTRACT(DOW FROM date) IN (5, 6) THEN ROUND(base_price * 1.25, 2)
            -- Random price variation
            ELSE ROUND(base_price * (0.9 + random() * 0.2), 2)
        END AS price,
        -- Some random dates are unavailable (about 30%)
        random() > 0.3 AS is_available
    FROM date_stay_combinations;

    -- Add sample stay reviews
    WITH user_data AS (
        SELECT id FROM auth.users ORDER BY id LIMIT 5
    ),
    stay_data AS (
        SELECT id FROM public.stays
    ),
    sample_comments AS (
        SELECT unnest(ARRAY[
            'Great place to stay! Everything was perfect.',
            'Had a wonderful time. Hosts were very accommodating.',
            'Beautiful location and exactly as described.',
            'Clean, comfortable, and convenient.',
            'Would definitely recommend this place.',
            'Perfect getaway, will be coming back.',
            'Loved the amenities and the location.',
            'Excellent value for the price.',
            'The photos don''t do it justice - even better in person!',
            'Amazing experience from start to finish.'
        ]) AS comment
    ),
    randomized_data AS (
        SELECT 
            s.id AS stay_id,
            COALESCE(
                (SELECT id FROM user_data ORDER BY random() LIMIT 1), 
                host_user_id
            ) AS user_id,
            floor(random() * 2 + 4)::int AS rating,  -- Random rating between 4 and 5
            (SELECT comment FROM sample_comments ORDER BY random() LIMIT 1) AS comment,
            (CURRENT_DATE - (random() * 90)::int * INTERVAL '1 day') AS created_at
        FROM stay_data s
        CROSS JOIN generate_series(1, 3)  -- Generate 3 reviews per stay
    )
    INSERT INTO public.stay_reviews (stay_id, user_id, rating, comment, created_at)
    SELECT 
        stay_id,
        user_id,
        rating,
        comment,
        created_at
    FROM randomized_data;

    RAISE NOTICE 'Seed data has been created successfully.';
END $$; 