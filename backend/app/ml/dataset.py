"""
SMS Corpus Dataset Generator with diverse realistic Spam, Phishing, Scam, and Legitimate (Ham) SMS messages.
Includes banking alerts, courier tracking, 2FA codes, account verification, conversational SMS, and promotions.
"""

RAW_DATASET = [
    # --- PHISHING & BANKING SCAMS ---
    ("URGENT: Wells Fargo alert. Your debit card has been temporarily locked due to suspicious charges. Verify immediately at http://bit.ly/wf-lock-restore", 1),
    ("CHASE SECURITY: A login attempt was detected from Moscow, RU. If this was not you, confirm your credentials right away at http://chase-security-verify.xyz", 1),
    ("Bank of America: Unusual activity detected on your checking account. Click http://tinyurl.com/bofa-action-req to unfreeze your access.", 1),
    ("CITIBANK ALERT: Your wire transfer of $1,850.00 is pending. If unauthorized, cancel it immediately at http://citi-wire-cancellation.click", 1),
    ("PNC Bank: Your mobile banking access has been suspended. Please confirm your SSN and PIN to reactivate: http://pnc-secure-reactivate.top", 1),
    ("Capital One Fraud Alert: Did you authorize a transaction of $940.00 at Apple Store? Reply YES or cancel at http://capone-fraud-prevention.work", 1),
    ("PAYPAL: You sent a payment of $650.00 to CryptoPay LLC. If you did not make this transaction, dispute here: http://paypal-dispute-center.xyz", 1),
    ("Venmo Security: Your payment method was charged $420.00. Revert this charge within 15 minutes at http://venmo-support-revert.buzz", 1),
    ("Coinbase Support: Unauthorized withdrawal request of 0.42 BTC initiated. Block transaction now: http://coinbase-auth-shield.online", 1),
    ("Binance Notice: Your 2FA device was changed. If you did not request this, secure your crypto wallet at http://binance-safety-check.site", 1),
    ("Apple ID Alert: Your account was accessed from an unrecognized iPhone 15 in Shenzhen. Verify your billing info at http://appleid-security-unlock.vip", 1),
    ("Netflix Notification: Your membership payment declined. Update payment method before midnight to avoid cancellation: http://netflix-billing-renew.cam", 1),
    ("AMAZON NOTICE: Your package could not be delivered due to invalid payment. Rectify your billing at http://amazon-payment-verification.link", 1),

    # --- DELIVERY & COURIER PHISHING ---
    ("USPS: Your parcel has arrived at our sorting facility but is held due to an incomplete address. Update info: http://bit.ly/usps-package-resolve", 1),
    ("FedEx Delivery: We attempted delivery of package #FX-98214 but no one was home. Reschedule and pay $1.99 redelivery fee at http://fedex-redelivery.xyz", 1),
    ("UPS Tracking Alert: Package 1Z99999999 is pending customs clearance. Unpaid duty of $2.45 required at http://ups-customs-clearance.top", 1),
    ("DHL Express: Shipment DHL-88219 is on hold at airport depot. Confirm your delivery address here: http://dhl-shipment-confirm.click", 1),
    ("Postal Service Alert: A parcel addressed to you was returned to depot. Confirm your street address within 24 hours: http://postal-redelivery.work", 1),

    # --- PRIZE / LOTTERY / CRYPTO & PAYMENT SOLICITATIONS ---
    ("CONGRATULATIONS! You have been selected as the grand winner of a $5,000 Walmart Gift Card! Claim your reward now at http://win-walmart-card.click", 1),
    ("URGENT: You have an unclaimed IRS tax refund of $1,420.00 pending direct deposit. Submit your direct deposit info: http://irs-refund-claim.xyz", 1),
    ("Final Notice: Your federal student loan forgiveness application has been approved for $20,000. Finalize disbursement: http://loan-forgiveness-claim.net", 1),
    ("Crypto Giveaway! Elon Musk is giving away 5,000 BTC. Send 0.1 BTC to receive 1.0 BTC immediately back at address: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", 1),
    ("Guaranteed instant cash advance of up to $5,000 deposited within 10 minutes with no credit check! Apply now: http://instant-cash-direct.loan", 1),
    ("WINNER: You won 2nd prize in the National Lottery Draw! Call +18005550199 or visit http://national-lottery-claims.org to redeem your cheque.", 1),
    ("Work from home and earn $450-$800 daily! Only smartphone required. Limited spots available, register today at http://remote-cash-careers.work", 1),
    ("Credit Repair Secret: Erase all late payments, collections, and bankruptcy in 30 days legally! Call now: +18005550188 for free consultation.", 1),
    ("Your car warranty has expired! Final warning before policy cancellation. Call 1-888-555-0144 to reinstate your complete coverage immediately.", 1),
    ("HOT DATING ALERT: 3 single women nearby want to chat with you right now! View photos and meet tonight at http://local-dates-tonight.cam", 1),
    ("CashApp Alert: You received $750.00 from Rewards Center. Complete simple survey to release funds: http://cashapp-reward-claim.online", 1),

    # --- MALICIOUS CREDENTIAL HARVESTING ---
    ("SECURITY WARNING: Your Microsoft Office 365 password expires in 2 hours. Keep current password by logging in at http://login-microsoftonline-verify.top", 1),
    ("Google Account Verification: Someone knows your Google password. Review device activity: http://google-safety-review.click", 1),
    ("IT Support Desk: Mandatory security upgrade required for all employee email accounts. Log in here to prevent suspension: http://company-it-portal.icu", 1),
    ("HR Notification: Open enrollment benefits document attached. Review and sign electronically at http://benefits-doc-portal.vip", 1),

    # --- LEGITIMATE / HAM MESSAGES ---
    ("Your Uber verification code is 482910. Never share this code with anyone.", 0),
    ("Your Google verification code is G-847291. Do not share it with anybody.", 0),
    ("Wells Fargo alert: A purchase of $14.50 was made at Starbucks on card ending in 4102. Reply NO if unauthorized.", 0),
    ("Chase: Your automatic monthly payment of $120.00 to Electric Co has been scheduled for Nov 15. View in app.", 0),
    ("Your Amazon order #112-9842104-58210 has shipped! Track your package with carrier UPS at https://amazon.com/track", 0),
    ("Hi Alex, are we still meeting at the library at 3:30 PM today?", 0),
    ("Hey mom, I just landed in Chicago! Going to grab my bags now. Talk soon.", 0),
    ("Dr. Davis Appointment Reminder: You have an appointment tomorrow at 10:00 AM. Reply 1 to confirm, 2 to reschedule.", 0),
    ("CVS Pharmacy: Your prescription is ready for pickup at 450 Main St. Reply STOP to opt out.", 0),
    ("Your food delivery from Chipotle is on the way! Your driver Marcus will arrive in approximately 12 minutes.", 0),
    ("Your Delta flight DL-482 to Atlanta is on time. Gate departure B24. Boarding begins at 1:15 PM.", 0),
    ("Can you please send me the PDF slides from yesterday's engineering sync when you get a chance?", 0),
    ("Dentist Reminder: Your 6-month dental checkup is scheduled for Tuesday at 2:00 PM.", 0),
    ("Hey, don't forget to bring the keys to the office tomorrow morning.", 0),
    ("Your two-factor authentication code for GitHub is 921048. Valid for 10 minutes.", 0),
    ("Hi David, the team lunch has been moved to Thai Basil at 12:45 PM today.", 0),
    ("Bank of America: Your monthly account statement is now ready to view securely in your mobile app.", 0),
    ("Target: Your drive-up order is ready! Pull into a numbered spot and let us know in the app.", 0),
    ("Hey Sarah, thanks so much for the dinner last night! We should definitely do that again soon.", 0),
    ("Your car service at AutoCare is complete and ready for pickup anytime before 6:00 PM.", 0),
    ("Your Airbnb reservation is confirmed! Check-in is tomorrow after 3:00 PM. Access code: 7492.", 0),
    ("Hi team, please review pull request #142 when you have a moment today. Thanks!", 0),
    ("Your haircut appointment with Rachel is confirmed for Saturday at 11:30 AM.", 0),
    ("Lyft is arriving in 3 minutes. White Toyota Camry, license plate 7XYZ89.", 0),
    ("Hi honey, can you pick up some milk and eggs on your way back from work?", 0),
    ("Your gym membership payment of $49.00 was successfully processed. Thank you for being a member!", 0),
    ("Your security code for Apple ID is 382910. Don't share it with anyone.", 0),
    ("School District Notice: Tomorrow will be a 2-hour delayed opening due to expected winter weather.", 0),
    ("Hey, are you free for a quick phone call sometime this afternoon?", 0),
    ("Your library books 'Clean Code' and 'Designing Data-Intensive Apps' are due in 3 days.", 0),
    ("Good morning! Just checking in to see if you received the contract I sent over on Monday.", 0),
    ("Thanks for visiting our store! How was your experience today? Rate 1-5 by replying to this message.", 0),
    ("Your reservation for party of 4 at Osteria Morini is confirmed for tonight at 7:30 PM.", 0)
]

def get_augmented_dataset():
    """Generates an expanded, balanced dataset with varied synthetic variations for robust training."""
    dataset = list(RAW_DATASET)
    
    # Generate variations of spam with different URLs, amounts, and brands
    spam_templates = [
        "SECURITY NOTICE: Your {bank} account has been flagged for unusual sign-ins. Secure your profile: {url}",
        "URGENT: {brand} fraud prevention has placed a temporary hold on your card. Verify immediately: {url}",
        "Your {carrier} shipment {pkg_id} is stopped at depot due to address fee of ${fee}. Pay at {url}",
        "Congratulations! You won ${amount} in the {promo} sweepstakes! Click {url} to claim before expiration.",
        "Alert: Your {service} subscription failed to bill. Enter valid payment card at {url} to prevent account loss.",
        "Dispute Alert: Transfer of ${amount} to unknown recipient pending. Cancel immediately: {url}",
        "Notice: Unclaimed federal stimulus check of ${amount} waiting for disbursement. Submit form: {url}"
    ]
    
    banks = ["Citibank", "Chase", "Wells Fargo", "Bank of America", "Capital One", "PNC Bank", "TD Bank", "US Bank"]
    brands = ["PayPal", "Venmo", "Amazon", "Apple", "Coinbase", "Binance", "Netflix"]
    carriers = ["USPS", "FedEx", "UPS", "DHL Express", "Royal Mail"]
    urls = [
        "http://bit.ly/secure-auth-99", "http://tinyurl.com/bank-protect-id", 
        "http://security-verify.top", "http://auth-restore.xyz", 
        "http://claim-rewards.click", "http://customs-pay.work",
        "http://account-unfreeze.site", "http://wallet-recover.cam"
    ]
    
    for i in range(70):
        b = banks[i % len(banks)]
        br = brands[i % len(brands)]
        c = carriers[i % len(carriers)]
        u = urls[i % len(urls)]
        amt = (i + 1) * 75 + 150
        fee = round(1.50 + (i % 5) * 0.45, 2)
        pkg = f"US-{92000 + i}"
        
        dataset.append((spam_templates[0].format(bank=b, url=u), 1))
        dataset.append((spam_templates[1].format(brand=br, url=u), 1))
        dataset.append((spam_templates[2].format(carrier=c, pkg_id=pkg, fee=fee, url=u), 1))
        dataset.append((spam_templates[3].format(amount=amt, promo=b, url=u), 1))
        dataset.append((spam_templates[4].format(service=br, url=u), 1))
        dataset.append((spam_templates[5].format(amount=amt, url=u), 1))

    # Generate legitimate variations
    ham_templates = [
        "Your authentication passcode for {service} is {code}. Never reveal this code to anyone.",
        "Hi {name}, I'll be arriving at {place} in about {min} minutes.",
        "Reminder: Your doctor appointment with Dr. {doctor} is scheduled for tomorrow at {time}.",
        "Your order from {store} is confirmed and will be ready for pickup between {time}.",
        "Hey {name}, are we still on for {event} this weekend?",
        "Your {bank} card statement ending in {last4} is ready. Total balance: ${bal}.",
        "Delivery update: Your package from {store} has been delivered to your front door."
    ]
    names = ["Michael", "Jessica", "Emily", "Daniel", "Sarah", "Chris", "Emma", "David", "Sophia", "James"]
    places = ["the office", "the coffee shop", "the airport", "downtown", "the library", "the gym"]
    doctors = ["Smith", "Patel", "Johnson", "Lee", "Williams", "Brown", "Miller"]
    stores = ["Home Depot", "Best Buy", "Target", "Whole Foods", "Sephora", "Nordstrom"]
    events = ["hiking", "dinner", "the movies", "brunch", "coffee", "study session"]
    services = ["Google", "Microsoft", "GitHub", "Dropbox", "Slack", "Zoom", "Uber", "Airbnb"]
    
    for i in range(65):
        nm = names[i % len(names)]
        pl = places[i % len(places)]
        doc = doctors[i % len(doctors)]
        st = stores[i % len(stores)]
        ev = events[i % len(events)]
        srv = services[i % len(services)]
        code = 100000 + (i * 3791) % 900000
        mins = 5 + (i * 3) % 25
        t = f"{(i % 6) + 9}:00 AM"
        last4 = f"{1000 + (i * 123) % 8999}"
        bal = f"{(i + 1) * 35}.40"
        
        dataset.append((ham_templates[0].format(service=srv, code=code), 0))
        dataset.append((ham_templates[1].format(name=nm, place=pl, min=mins), 0))
        dataset.append((ham_templates[2].format(doctor=doc, time=t), 0))
        dataset.append((ham_templates[3].format(store=st, time=t), 0))
        dataset.append((ham_templates[4].format(name=nm, event=ev), 0))
        dataset.append((ham_templates[5].format(bank=banks[i % len(banks)], last4=last4, bal=bal), 0))
        dataset.append((ham_templates[6].format(store=st), 0))

    return dataset
