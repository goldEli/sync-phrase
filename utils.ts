
export function get_locale_file_name(name: string){
    if(['zh', 'zh-cn', 'zh_cn', 'zhcn'].includes(name)){
        return {
            "code": "zh-CN",
        }
    }
    if(['en', 'en-us', 'en_us', 'enus'].includes(name)){
        return {
            "code": "en-US",
        }
    }
    if(['zh-tw', 'zh_tw', 'zhtw'].includes(name)){
        return {
            "code": "zh-TW",
        }
    }
    if(['vi', 'vi-vn', 'vi_vn', 'vivn'].includes(name)){
        return {
            "code": "vi",
        }
    }

    if(['ar', 'ar-sa', 'ar_sa', 'arsa', 'ar_ar', 'ar-ar','arar'].includes(name)){
        return {
            "code": "ar",
        }
    }
    if(['de', 'de-de', 'de_de', 'dede'].includes(name)){
        return {
            "code": "de",
        }
    }
    if(['es', 'es-419', 'es_419', 'es419'].includes(name)){
        return {
            "code": "es-419",
        }
    }
    if(['es-AR', 'es-ar', 'es_ar', 'esAR'].includes(name)){
        return {
            "code": "es-AR",
        }
    }
    if(['es-es', 'es_es', 'eses'].includes(name)){
        return {
            "code": "es-ES",
        }
    }

    if(['fa', 'fa-ir', 'fa_ir', 'fari'].includes(name)){
        return {
            "code": "fa-IR",
        }
    }

    if(['fr', 'fr-fr', 'fr_fr', 'frfr'].includes(name)){
        return {
            "code": "fr",
        }
    }
    
    if(['it', 'it-it', 'it_it', 'itit'].includes(name)){
        return {
            "code": "it",
        }
    }

    if(['ja', 'ja-jp', 'ja_jp', 'jajp'].includes(name)){
        return {
            "code": "ja",
        }
    }

    if(['ko', 'ko-kr', 'ko_kr', 'koko'].includes(name)){
        return {
            "code": "ko",
        }
    }

    if(['pl', 'pl-pl', 'pl_pl', 'plpl'].includes(name)){
        return {
            "code": "pl",
        }
    }

    if(['pt', 'pt-pt', 'pt_pt', 'ptPT'].includes(name)){
        return {
            "code": "pt-PT",
        }
    }


    if(['pt', 'pt-br', 'pt_br', 'ptbr'].includes(name)){
        return {
            "code": "pt-BR",
        }
    }


    if(['ru', 'ru-ru', 'ru_ru', 'ruru'].includes(name)){
        return {
            "code": "ru",
        }
    }


    if(['tr', 'tr-tr', 'tr_tr', 'trtr'].includes(name)){
        return {
            "code": "tr",
        }
    }


    if(['uk', 'uk-ua', 'uk_ua', 'ukua', 'uk-uk', 'uk_uk', 'ukuk'].includes(name)){
        return {
            "code": "uk",
        }
    }


    if(['en_tr', 'en-tr', 'entr'].includes(name)){
        return {
            "code": "en-TR",
        }
    }



}