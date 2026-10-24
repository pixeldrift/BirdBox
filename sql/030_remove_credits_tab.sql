-- Credits now lives inside About; remove the old Credits menu row.
delete from navigation where id = 'account/credits';
