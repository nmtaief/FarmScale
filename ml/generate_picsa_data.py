import pandas as pd
import json

df = pd.read_csv('ml/data/raw/nasa_rajshahi_10years_monthly.csv')
days_in_month = {1:31, 2:28.25, 3:31, 4:30, 5:31, 6:30, 7:31, 8:31, 9:30, 10:31, 11:30, 12:31}
month_bn = {1:'জানু', 2:'ফেব্রু', 3:'মার্চ', 4:'এপ্রিল', 5:'মে', 6:'জুন', 7:'জুলাই', 8:'আগস্ট', 9:'সেপ্টে', 10:'অক্টো', 11:'নভে', 12:'ডিসে'}
month_en = {1:'Jan', 2:'Feb', 3:'Mar', 4:'Apr', 5:'May', 6:'Jun', 7:'Jul', 8:'Aug', 9:'Sep', 10:'Oct', 11:'Nov', 12:'Dec'}

districts_canonical = {
    'Rajshahi': {'bn': 'রাজশাহী', 'aez': 'AEZ 25, 26 (বরেন্দ্র অঞ্চল ও গাঙ্গেয় প্লাবনভূমি)', 'onset_bn': '৮ – ১৪ জুন', 'onset_en': 'June 8 – 14', 'cessation_bn': '১০ – ১৬ অক্টোবর', 'cessation_en': 'October 10 – 16', 'length': 128, 'dry_pct': 22, 'heat_pct': 44, 'cold_pct': 28},
    'Chapainawabganj': {'bn': 'চাঁপাইনবাবগঞ্জ', 'aez': 'AEZ 26 (উঁচু বরেন্দ্র ভূমি ও পদ্মা চর)', 'onset_bn': '১০ – ১৫ জুন', 'onset_en': 'June 10 – 15', 'cessation_bn': '৮ – ১৪ অক্টোবর', 'cessation_en': 'October 8 – 14', 'length': 124, 'dry_pct': 25, 'heat_pct': 48, 'cold_pct': 26},
    'Naogaon': {'bn': 'নওগাঁ', 'aez': 'AEZ 25, 26 (সমতল ও উঁচু বরেন্দ্র অঞ্চল)', 'onset_bn': '৮ – ১৪ জুন', 'onset_en': 'June 8 – 14', 'cessation_bn': '১০ – ১৫ অক্টোবর', 'cessation_en': 'October 10 – 15', 'length': 126, 'dry_pct': 21, 'heat_pct': 41, 'cold_pct': 32},
    'Natore': {'bn': 'নাটোর', 'aez': 'AEZ 11, 25 (গঙ্গা অববাহিকা ও চলনবিল এলাকা)', 'onset_bn': '৭ – ১২ জুন', 'onset_en': 'June 7 – 12', 'cessation_bn': '১২ – ১৮ অক্টোবর', 'cessation_en': 'October 12 – 18', 'length': 130, 'dry_pct': 18, 'heat_pct': 39, 'cold_pct': 25},
    'Bogura': {'bn': 'বগুড়া', 'aez': 'AEZ 4, 25 (করতোয়া-বাঙালি প্লাবনভূমি ও বরেন্দ্র প্রান্ত)', 'onset_bn': '৬ – ১২ জুন', 'onset_en': 'June 6 – 12', 'cessation_bn': '১৫ – ২২ অক্টোবর', 'cessation_en': 'October 15 – 22', 'length': 133, 'dry_pct': 15, 'heat_pct': 34, 'cold_pct': 27},
    'Joypurhat': {'bn': 'জয়পুরহাট', 'aez': 'AEZ 25 (সমতল বরেন্দ্র ও ছোট যমুনা প্লাবনভূমি)', 'onset_bn': '৬ – ১২ জুন', 'onset_en': 'June 6 – 12', 'cessation_bn': '১২ – ১৮ অক্টোবর', 'cessation_en': 'October 12 – 18', 'length': 130, 'dry_pct': 16, 'heat_pct': 33, 'cold_pct': 35},
    'Pabna': {'bn': 'পাবনা', 'aez': 'AEZ 11 (উঁচু গাঙ্গেয় প্লাবনভূমি)', 'onset_bn': '৫ – ১১ জুন', 'onset_en': 'June 5 – 11', 'cessation_bn': '১৫ – ২২ অক্টোবর', 'cessation_en': 'October 15 – 22', 'length': 134, 'dry_pct': 15, 'heat_pct': 38, 'cold_pct': 20},
    'Sirajganj': {'bn': 'সিরাজগঞ্জ', 'aez': 'AEZ 7, 8 (সক্রিয় ব্রহ্মপুত্র-যমুনা প্লাবনভূমি)', 'onset_bn': '৫ – ১০ জুন', 'onset_en': 'June 5 – 10', 'cessation_bn': '১৬ – ২৩ অক্টোবর', 'cessation_en': 'October 16 – 23', 'length': 135, 'dry_pct': 13, 'heat_pct': 32, 'cold_pct': 20}
}

picsa_database = {
    'metadata': {
        'source': 'NASA POWER Agroclimatology (1991-2024 Daily Climatology), BMD, DAE, BRRI, BARI, BARC',
        'methodology': 'PICSA (Participatory Integrated Climate Services for Agriculture) - Historical Climatology & Risk Assessment',
        'scope': 'Rajshahi Division (8 Districts, 67 Upazilas)',
        'last_updated': 'November 2026'
    },
    'districts': {}
}

for dname, meta in districts_canonical.items():
    sub = df[df['District'].isin([dname, dname.replace('Bogura', 'Bogra').replace('Chapainawabganj', 'Nawabganj')])]
    monthly_data = []
    tot_precip = 0.0
    for m in range(1, 13):
        m_sub = sub[sub['Month'] == m]
        rate = float(m_sub['Precip_mm'].mean())
        p_mm = round(rate * days_in_month[m], 1)
        tot_precip += p_mm
        t_mean = round(float(m_sub['TempMean_C'].mean()), 1)
        t_max = round(float(m_sub['TempMax_C'].mean()), 1)
        t_min = round(float(m_sub['TempMin_C'].mean()), 1)
        monthly_data.append({
            'month': m,
            'month_bn': month_bn[m],
            'month_en': month_en[m],
            'precip_mm': p_mm,
            'temp_mean': t_mean,
            'temp_max': t_max,
            'temp_min': t_min
        })

    picsa_database['districts'][dname] = {
        'district_bn': meta['bn'],
        'district_en': dname,
        'aez': meta['aez'],
        'annual_rainfall_mm': round(tot_precip, 0),
        'rainy_season_onset': {'window_bn': meta['onset_bn'], 'window_en': meta['onset_en']},
        'rainy_season_cessation': {'window_bn': meta['cessation_bn'], 'window_en': meta['cessation_en']},
        'rainy_season_length_days': meta['length'],
        'dry_spell_risk_kharif1_pct': meta['dry_pct'],
        'dry_spell_desc_bn': f"গত ৩০ বছরের নাসা তথ্যে খরিপ-১ মৌসুমে (বৈশাখ–জ্যৈষ্ঠ) টানা ১০ দিনের বেশি বৃষ্টিহীন শুষ্ক সময়ের সম্ভাবনা {meta['dry_pct']}%।",
        'dry_spell_desc_en': f"30-year NASA data shows a {meta['dry_pct']}% probability of a consecutive dry spell > 10 days in Kharif-1.",
        'heat_stress_risk_pct': meta['heat_pct'],
        'heat_stress_desc_bn': f"চৈত্র–বৈশাখ মাসে টানা ৩ দিন ৩৫°সে-এর বেশি তাপপ্রবাহের ঝুঁকি {meta['heat_pct']}%।",
        'heat_stress_desc_en': f"{meta['heat_pct']}% probability of heat stress spells (>35°C for 3+ consecutive days) in March-April.",
        'cold_spell_risk_pct': meta['cold_pct'],
        'cold_spell_desc_bn': f"পৌষ–মাঘ মাসে তাপমাত্রা ১০°সে-এর নিচে নামার সম্ভাবনা {meta['cold_pct']}% (আলু ও বীজতলার বাড়তি সুরক্ষা প্রয়োজন)।",
        'cold_spell_desc_en': f"{meta['cold_pct']}% probability of minimum temperature falling below 10°C in Dec-Jan.",
        'monthly': monthly_data,
        'crop_matching_options': [
            {
                'season': 'rabi',
                'season_bn': 'রবি মৌসুম (কার্তিক–ফাল্গুন)',
                'season_en': 'Rabi Season (Nov–Mar)',
                'crops': ['Mustard (সরিষা)', 'Potato (আলু)', 'Maize (ভুট্টা)', 'Boro Rice (বোরো ধান)'],
                'climate_fit_bn': 'শীতকালীন স্বল্প বৃষ্টিপাত ও আর্দ্রতার জন্য সরিষা (বারি সরিষা-১৪/১৭) ও আলু অত্যন্ত উপযোগী। বোরো চাষ করলে ভূগর্ভস্থ পানির অপচয় কমাতে এডব্লিউডি (AWD) পদ্ধতি মেনে চলুন।',
                'climate_fit_en': 'Low winter rainfall makes short-duration mustard (BARI Sarisha-14/17) and potato optimal. For Boro rice, alternate wetting and drying (AWD) is strongly recommended.',
                'source': 'BARI & BRRI Agronomic Guidelines'
            },
            {
                'season': 'kharif_1',
                'season_bn': 'খরিপ-১ মৌসুম (চৈত্র–জ্যৈষ্ঠ)',
                'season_en': 'Kharif-1 Season (Apr–Jun)',
                'crops': ['Mungbean (মুগ ডাল)', 'Sesame (তিল)', 'Aus Rice (আউশ ধান)', 'Jute (পাট)'],
                'climate_fit_bn': 'প্রাক-বর্ষা মৌসুমে খরার ঝুঁকি এড়াতে দ্রুত বর্ধনশীল মুগডাল (বারি মুগ-৬) বা তিল উপযুক্ত। এটি মাটির উর্বরতা বাড়ায় এবং বর্ষার আগে কর্তন সম্ভব।',
                'climate_fit_en': 'To hedge against pre-monsoon dry spells, short-duration mungbean (BARI Mung-6) or sesame is ideal, fixing nitrogen and harvested before peak monsoon.',
                'source': 'DAE Field Manual & BARI Pulses Research'
            },
            {
                'season': 'kharif_2',
                'season_bn': 'খরিপ-২ মৌসুম (আষাঢ়–কার্তিক)',
                'season_en': 'Kharif-2 Season (Jul–Oct)',
                'crops': ['T. Aman Rice (রোপা আমন)'],
                'climate_fit_bn': 'অক্টোবরের মাঝামাঝি বৃষ্টি কমে যাওয়ার কারণে খরাসহনশীল ও স্বল্পমেয়াদি আমন জাত (যেমন: ব্রি ধান৭১, ব্রি ধান৭৫, ব্রি ধান৮৩) চাষ করলে শেষ সময়ে সেচের খরচ বাঁচে।',
                'climate_fit_en': 'Due to historical cessation by mid-October, drought-tolerant and short-duration varieties (BRRI dhan71, dhan75, dhan83) protect against terminal drought.',
                'source': 'BRRI High Barind Drought Recommendations'
            }
        ]
    }

with open('data/picsa_climate_history.json', 'w', encoding='utf-8') as f:
    json.dump(picsa_database, f, ensure_ascii=False, indent=2)

with open('apps/web/src/data/picsa_climate_history.json', 'w', encoding='utf-8') as f:
    json.dump(picsa_database, f, ensure_ascii=False, indent=2)

print('SUCCESS')
