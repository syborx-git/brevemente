package com.syborx.brevemente.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String CACHE_CORPUS_QUERIES = "leva_corpus_queries";
    public static final String CACHE_CLINICAL_PROTOCOLS = "leva_clinical_protocols";

    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();
        cacheManager.setCacheNames(List.of(CACHE_CORPUS_QUERIES, CACHE_CLINICAL_PROTOCOLS));
        return cacheManager;
    }

    @Bean("corpusQueryKeyGenerator")
    public KeyGenerator corpusQueryKeyGenerator() {
        return (target, method, params) -> {
            String query = (params.length > 0 && params[0] != null)
                    ? params[0].toString().trim().toLowerCase().replaceAll("\\s+", " ")
                    : "";
            String filter = (params.length > 1 && params[1] != null)
                    ? params[1].toString().trim().toLowerCase()
                    : "none";
            return "q:" + query + "|f:" + filter;
        };
    }
}
