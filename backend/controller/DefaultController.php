<?php

namespace Controller;

use Lib\Controller;
use Lib\HtmlResponse;

// モデル
use Model\Game;

/**
 * デフォルトのコントローラ
 */
class DefaultController extends Controller {
    public function index() {
        $body = [];
        $body[] = "<div>";
        $body[] = "<h3>Project Plan</h3>";
        $body[] = "[<a href=\"../public/\">Main Menu</a>]";
        $body[] = "</div>";
        return new HtmlResponse($body);
    }    
}