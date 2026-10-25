-- The Classifieds section's Browse tab is now called Classifieds.
update navigation set label = 'Classifieds' where id = 'classifieds/browse' and label = 'Browse';
