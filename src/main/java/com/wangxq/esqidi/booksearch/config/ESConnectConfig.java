package com.wangxq.esqidi.booksearch.config;

import org.apache.http.HttpHost;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestHighLevelClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

/**
 * @Description:
 * @Author: wxq
 * @Date: 2020/7/19 9:46
 * @Version: 1.0
 **/
@Component
public class ESConnectConfig {

    @Value("${es.hostname}")
    private String hostname;

    @Value("${es.port}")
    private int port;

    @Value("${es.scheme}")
    private String scheme;

    @Bean
    public RestHighLevelClient restHighLevelClient() {
        RestHighLevelClient restHighLevelClient = new RestHighLevelClient(
                RestClient.builder(
                        new HttpHost(hostname, port, scheme)
                )
        );
        return restHighLevelClient;
    }

}
