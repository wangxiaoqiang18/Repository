package com.wangxq.esqidi.booksearch.controller;

import com.wangxq.esqidi.booksearch.model.PageInfo;
import com.wangxq.esqidi.booksearch.service.BookInfoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * @Description:
 * @Author: wxq
 * @Date: 2020/7/19 9:41
 * @Version: 1.0
 **/
@Controller
@RequestMapping("bookInfo")
public class BookInfoController {

    @Autowired
    @Qualifier("bookInfoService")
    private BookInfoService bookInfoService;

    @RequestMapping("createIndex")
    @ResponseBody
    public boolean createIndex() {
        return bookInfoService.createIndex();
    }

    @RequestMapping("loadData")
    @ResponseBody
    public boolean loadData(String keyword) {
        return bookInfoService.loadData(keyword);
    }

    @RequestMapping(value = "/getBookInfoList")
    @ResponseBody
    public List<Map<String, Object>> getBookInfoList(int pageSize, int pageIndex, String keyword) throws IOException {
        return bookInfoService.getBookInfoList(pageSize, pageIndex,keyword);
    }

    @RequestMapping("/")
    public String index() {
        return "search";
    }
}
