package com.wangxq.esqidi.booksearch.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.wangxq.esqidi.booksearch.model.BookInfo;
import com.wangxq.esqidi.booksearch.model.PageInfo;
import com.wangxq.esqidi.booksearch.util.HtmlParsingUtil;
import org.elasticsearch.action.bulk.BulkRequest;
import org.elasticsearch.action.bulk.BulkResponse;
import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.client.indices.CreateIndexRequest;
import org.elasticsearch.client.indices.CreateIndexResponse;
import org.elasticsearch.common.xcontent.XContentType;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.index.query.QueryStringQueryBuilder;
import org.elasticsearch.search.SearchHit;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * @Description:
 * @Author: wxq
 * @Date: 2020/7/19 9:44
 * @Version: 1.0
 **/
@Service("bookInfoService")
@Transactional
public class BookInfoService {

    @Autowired
    private RestHighLevelClient restHighLevelClient;

    @Autowired
    private HtmlParsingUtil htmlParsingUtil;

    public List<Map<String,Object>> getBookInfoList(int pageSize, int pageIndex, String keyword) throws IOException {
        SearchRequest searchRequest = new SearchRequest("qd_bookinfo");
        SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder();
        searchSourceBuilder.from(pageIndex);
        searchSourceBuilder.size(pageSize);
        QueryStringQueryBuilder matchQueryBuilder = QueryBuilders.queryStringQuery(keyword);
        searchSourceBuilder.query(matchQueryBuilder);
        searchRequest.source(searchSourceBuilder);
        List<Map<String, Object>> list = new ArrayList<>();
        SearchResponse search = restHighLevelClient.search(searchRequest, RequestOptions.DEFAULT);
        for (SearchHit fields : search.getHits().getHits()) {
            Map<String, Object> map = fields.getSourceAsMap();
            list.add(map);
        }
        return list;
    }

    public boolean createIndex() {
        try {
            CreateIndexRequest indexRequest = new CreateIndexRequest("qd_bookinfo");
            CreateIndexResponse response = restHighLevelClient.indices().create(indexRequest, RequestOptions.DEFAULT);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
        return true;
    }

    public boolean loadData(String keyword) {
        try {
            List<BookInfo> bookInfoList = htmlParsingUtil.pasJd(keyword);
            BulkRequest bulkRequest = new BulkRequest();
            bulkRequest.timeout("100s");
            bookInfoList.forEach(item -> {
                IndexRequest request = new IndexRequest("qd_bookinfo");
                request.source(JSON.toJSONString(item), XContentType.JSON);
                bulkRequest.add(request);
            });
            BulkResponse bulk = restHighLevelClient.bulk(bulkRequest, RequestOptions.DEFAULT);
            return !bulk.hasFailures();
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
