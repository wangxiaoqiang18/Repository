package com.wangxq.esqidi.booksearch.util;

import com.wangxq.esqidi.booksearch.model.BookInfo;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * @Description:
 * @Author: wxq
 * @Date: 2020/7/2 21:26
 * @Version: 1.0
 **/
@Component
public class HtmlParsingUtil {

    public List<BookInfo> pasJd(String keyword) throws IOException {
        String url = "https://www.qidian.com/search?kw=" + URLEncoder.encode(keyword, "utf-8");
        Document document = Jsoup.parse(new URL(url), 30000);
        Element element = document.getElementById("result-list");
        Elements elements = element.getElementsByTag("li");
        List<BookInfo> bookInfoList = new ArrayList<>();
        for (Element ele : elements) {
            BookInfo bookInfo = new BookInfo();
            String img = ele.getElementsByTag("img").eq(0).attr("src");
            bookInfo.setImage(img);
            String title = ele.getElementsByTag("h4").eq(0).text();
            bookInfo.setTitle(title);
            Elements authorElements = ele.getElementsByClass("author").get(0).getElementsByTag("a");
            String isOver = ele.getElementsByClass("author").get(0).getElementsByTag("span").last().text();
            String author = authorElements.get(0).text();
            bookInfo.setAuthor(author);
            String typeCodes = "";
            for (int i = 1; i < authorElements.size(); i++) {
                typeCodes += authorElements.get(i).text() + ",";
            }
            typeCodes += isOver;
            bookInfo.setTypeCodes(typeCodes);
            String intro = ele.getElementsByClass("intro").eq(0).text();
            bookInfo.setIntro(intro);
            String update = ele.getElementsByClass("update").eq(0).text();
            bookInfo.setUpdate(update);
            Elements total = ele.getElementsByClass("total");
            for (Element element1 : total) {
                String totalWordNum = element1.getElementsByTag("span").eq(0).text();
                bookInfo.setTotalWordNum(totalWordNum);
                String totalRecommendNum = element1.getElementsByTag("span").eq(1).text();
                bookInfo.setTotalRecommendNum(totalRecommendNum);
            }
            bookInfo.setId(UUID.randomUUID().toString().replaceAll("-", ""));
            bookInfoList.add(bookInfo);
        }
        return bookInfoList;
    }
}
