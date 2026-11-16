create table if not exists public.extra_mail_items (
  id uuid primary key default gen_random_uuid(),

  character_key text not null,
  source_no integer,

  title text not null,
  mail_date date not null,

  original_text text not null default '',
  translation_text text,

  occasion text,
  image_url text,

  is_published boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (character_key, title, mail_date),
  unique (character_key, source_no)
);

create index if not exists
  extra_mail_items_date_idx
  on public.extra_mail_items (
    mail_date desc
  );

create index if not exists
  extra_mail_items_character_date_idx
  on public.extra_mail_items (
    character_key,
    mail_date desc
  );

alter table public.extra_mail_items
  enable row level security;

drop policy if exists
  "extra mail public read"
  on public.extra_mail_items;

create policy
  "extra mail public read"
  on public.extra_mail_items
  for select
  to anon, authenticated
  using (is_published = true);


create table if not exists public.extra_mail_relations (
  id uuid primary key default gen_random_uuid(),

  mail_id uuid not null
    references public.extra_mail_items(id)
    on delete cascade,

  target_type text not null
    check (
      target_type in (
        'card',
        'illustration',
        'story',
        'event'
      )
    ),

  target_id uuid not null,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),

  unique (
    mail_id,
    target_type,
    target_id
  )
);

create index if not exists
  extra_mail_relations_mail_idx
  on public.extra_mail_relations (
    mail_id,
    target_type,
    sort_order
  );

alter table public.extra_mail_relations
  enable row level security;

drop policy if exists
  "extra mail relations public read"
  on public.extra_mail_relations;

create policy
  "extra mail relations public read"
  on public.extra_mail_relations
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.extra_mail_items m
      where m.id = mail_id
        and m.is_published = true
    )
  );


insert into public.extra_mail_items (
  character_key,
  source_no,
  title,
  mail_date,
  original_text,
  translation_text,
  occasion,
  image_url,
  is_published
)
values
  ('baiqi', 1, '我的礼物', DATE '2017-12-29', '听说新年要送红包，随手包了一个，我的礼物还在后面。', null, null, null, true),
  ('baiqi', 2, '有你的新年', DATE '2018-02-16', '新年快乐，有你的新年，幸福的有点不真实。', null, null, null, true),
  ('baiqi', 3, '元宵', DATE '2018-03-02', '因为你，元宵节开始有了意义。', null, null, null, true),
  ('baiqi', 4, '给你的礼物', DATE '2018-03-14', '每颗子弹都见证了我对你的想念，现在我把它们都送给你。', null, null, null, true),
  ('baiqi', 5, '和你的约定', DATE '2018-04-01', '我永远不会对你说谎，让银杏见证我对你的誓言。', null, null, null, true),
  ('baiqi', 6, '最好的时光', DATE '2018-05-20', '有你的时光，都是最好的时光。', null, null, null, true),
  ('baiqi', 7, '可爱的你', DATE '2018-06-01', '节日快乐。你很可爱，不止是今天。', null, null, null, true),
  ('baiqi', 8, '给你的承诺', DATE '2018-06-08', '以后不管发生什么都别怕，我一直在你身旁。', null, null, null, true),
  ('baiqi', 9, '简单愿望', DATE '2018-06-18', '端午安康。希望以后的每个端午，都能吃到你包的粽子。', null, null, null, true),
  ('baiqi', 10, '唯一船票', DATE '2018-07-06', '不用多一张船票，我跟你走。', null, null, null, true),
  ('baiqi', 11, '白起的生日回礼', DATE '2018-07-29', '希望余生的每天，都能和今天一样，与你同乐。你愿意为我实现这个愿望吗？我的女孩。', null, null, null, true),
  ('baiqi', 12, '无畏之心', DATE '2018-08-16', '锁吧，不管那些故事是不是真的，我都会和你锁在一起。', null, null, null, true),
  ('baiqi', 13, '有备而来', DATE '2018-08-17', '七夕节快乐。今天一整天我都属于你，你想做什么都行。', null, null, null, true),
  ('baiqi', 14, '午间话题', DATE '2018-09-05', '期待？最近也没什么特别的……咳，有你，就很好。', null, null, null, true),
  ('baiqi', 15, '小黑的话', DATE '2018-09-13', '看上去小黑的状态不错。他说趁着天气正好，想和你一起兜风。', null, null, null, true),
  ('baiqi', 16, '玩笑之后', DATE '2018-09-21', '笑得前仰后合的，有这么好笑？……不过你那样笑起来很好看，我很喜欢。', null, null, null, true),
  ('baiqi', 17, '遥月侧畔', DATE '2018-09-22', '木星之月是遥月，在天上。我的月亮是你，在身旁。', null, null, null, true),
  ('baiqi', 18, '这样就好', DATE '2018-09-27', '就这样和你在一起就很好。', null, null, null, true),
  ('baiqi', 19, '来自狼先生的询问', DATE '2018-10-31', '送给我的狼耳朵，能在只有你看到的时候才带吗？', null, null, null, true),
  ('baiqi', 20, '一如既往', DATE '2018-12-20', '无论是一年还是十年，我的信仰都会一如既往。还有以后的每一天……都想见到你的身影。', null, null, null, true),
  ('baiqi', 21, '平安约定', DATE '2018-12-24', '那顶驯鹿帽好像不太适合我。不过以后每个平安夜，礼物和我都会准时来到你身边。', null, null, null, true),
  ('baiqi', 22, '少熬夜，多睡觉', DATE '2019-01-01', '新年第一天就别熬夜了。等睡醒起来，我们再出去庆祝。', null, null, null, true),
  ('baiqi', 23, '这次可以不系领带吗？', DATE '2019-02-04', '忙完家里的事跟我说一声，带你去个地方。当然，陪你一起先走亲戚也可以。', null, null, null, true),
  ('baiqi', 24, '没事，做起来也不是很累', DATE '2019-02-14', '这个做起来也不是很花时间，找天教你？不过下次说“喜欢”的时候，一次就够了。', null, null, null, true),
  ('baiqi', 25, '华灯初上', DATE '2019-02-19', '万家灯火，有一盏灯由你为我点亮。', null, null, null, true),
  ('baiqi', 26, '浓情蜜意', DATE '2019-03-14', '巧克力好像做得有点多……不过没关系，我们一起慢慢吃。', null, null, null, true),
  ('baiqi', 27, '不用担心人多的问题', DATE '2019-05-01', '你只要把行李收拾好就行。外套带不带都没关系，反正有我在。我保证，会让你看到全世界最美的星星。', null, null, null, true),
  ('baiqi', 28, '轻诉心声', DATE '2019-05-20', '动物都很可爱，咳……你也是。', null, null, null, true),
  ('baiqi', 29, '游戏厅和游乐场，选一个。', DATE '2019-06-01', '我不太确定儿童节一般都会去些什么地方。要不回来的时候去吃个儿童套餐？', null, null, null, true),
  ('baiqi', 30, '高考似乎总是和端午撞上', DATE '2019-06-07', '一路上看见很多考生，回想起了一些事，见面的时候说给你听。', null, null, null, true),
  ('baiqi', 31, '白起的生日回礼', DATE '2019-07-29', '想说今天就是最好的一天，但以后有你陪伴的每一天，都是最好的。下一个生日愿望，也只有你能实现。', null, null, null, true),
  ('baiqi', 32, '星汉迢迢', DATE '2019-08-06', '你眼中有漫天星光，我却只看得到你。', null, null, null, true),
  ('baiqi', 33, '因你圆满', DATE '2019-09-13', '中秋月圆，我也因你而圆满。', null, null, null, true),
  ('baiqi', 34, '一起去影城的万圣之夜吧', DATE '2019-10-31', '我看了下，有你喜欢的角色……你之前好像这么说过。', null, null, null, true),
  ('baiqi', 35, '和你一起经历的旅程', DATE '2019-12-20', '这两年我看到了许多从未见过的风景，也不再是孤身一人。和你相伴的这场旅途，我希望它没有终点。', null, null, null, true),
  ('baiqi', 36, '节日必备', DATE '2019-12-24', '对我来说圣诞节唯一必要的，只有你。', null, null, null, true),
  ('baiqi', 37, '小黑已经准备就绪', DATE '2020-01-01', '新的一年，还有更远的以后，无论你想去哪里，我都会和你一起。', null, null, null, true),
  ('baiqi', 38, '新的一步', DATE '2020-02-08', '我之前不懂“圆满”，直到你端着那碗小小的元宵，笑着和我说“新的一年，美满团圆。”', null, null, null, true),
  ('baiqi', 39, '山顶融雪', DATE '2020-03-14', '今天想去山顶看初春的融雪吗？下午我来接你。', null, null, null, true),
  ('baiqi', 40, '数字谐音', DATE '2020-05-20', '不需要用什么数字谐音，有想说的话直接说就好。', null, null, null, true),
  ('baiqi', 41, '回到过去', DATE '2020-06-01', '今天交给我，我会让你做回最无忧无虑的自己。', null, null, null, true),
  ('baiqi', 42, '甜蜜暗示', DATE '2020-06-25', '今年吃到的第一个粽子是蜜枣味的，感觉是个好兆头。', null, null, null, true),
  ('baiqi', 43, '白起的生日回礼', DATE '2020-07-29', '以后有机会，再一起回老屋看看吧。我们可以在院子里种上点别的花。', null, null, null, true),
  ('baiqi', 44, '一天都不会少', DATE '2020-09-17', '不仅是一千天，两千、三千，甚至更多天，我都会在你身边。说到做到。', null, null, null, true),
  ('baiqi', 45, '相似的温暖', DATE '2020-12-20', '相似的内容，已经是第三次跟你说了。回想曾经的这天，心里都会很暖，也会更期待明年这天，我们会怎样度过。', null, null, null, true),
  ('baiqi', 46, '买了顶圣诞帽', DATE '2020-12-24', '快递是你的。你头像上的圣诞帽很可爱，买了顶跟它相似的，你戴上一定会更可爱。', null, null, null, true),
  ('baiqi', 47, '突如其来的微风', DATE '2021-01-01', '训练时突然刮起了微风，看来连它都在提醒我快点回家见你。今天和今年，都想和你一起度过。', null, null, null, true),
  ('baiqi', 48, '即刻出发', DATE '2021-02-14', '你心心念念的那家私人影院已经探好路了，想什么时候去都可以，但如果是今天会更好。', null, null, null, true),
  ('baiqi', 49, '天灯轨迹', DATE '2021-02-26', '别担心，今晚我们放的灯一定会是飞得最高的那一个。', null, null, null, true),
  ('baiqi', 50, '迎风出发', DATE '2021-03-14', '之前你说想去草地野餐，今天怎么样？春光很好，我们可以迎风出发。', null, null, null, true),
  ('baiqi', 51, '想要的礼物', DATE '2021-05-20', '不用特意去准备什么惊喜。我最想要的礼物，从来都和你有关。', null, null, null, true),
  ('baiqi', 52, '怀旧零食', DATE '2021-06-01', '新开了一家怀旧零食店，不知会不会有你小时候最喜欢的那种，一起去逛逛吗？', null, null, null, true),
  ('baiqi', 53, '登高望远', DATE '2021-06-12', '都说端午适合登高，我发现了一个视野开阔的好地方，景色也很不错。这就带你去。', null, null, null, true),
  ('baiqi', 54, '白起的生日回礼', DATE '2021-07-29', '你的心意太珍贵，除了把它好好藏起来，我想不到别的方式。所以这样的心意，以后也只能给我一个人看。', null, null, null, true),
  ('baiqi', 55, '风起星河', DATE '2021-08-14', '放心，不用担心天气的问题。跟着我，一定带你看到今晚最美的夜空。', null, null, null, true),
  ('baiqi', 56, '触摸月亮', DATE '2021-09-19', '今晚我带你去最好的观月地点——天空，你可以亲手“触摸”月亮了。', null, null, null, true),
  ('baiqi', 57, '换装道具', DATE '2021-10-31', '我买了一件斗篷配合你的魔法帽，到时候走在一起应该会很相配。', null, null, null, true),
  ('baiqi', 58, '属于我们的时刻', DATE '2021-12-20', '一年当中特别的不只是这一天，而是属于我们的每个时刻。放心，我会让这些时刻不留任何遗憾。', null, null, null, true),
  ('baiqi', 59, '窗边的圣诞', DATE '2021-12-24', '一个预告：今晚的礼物，会从窗户外出现。', null, null, null, true),
  ('baiqi', 60, '最好的开始', DATE '2022-01-01', '我买了两件家居服，今年的第一天和你一起穿，一定是个最好的开始。', null, null, null, true),
  ('baiqi', 61, '隐藏路线', DATE '2022-02-14', '偶然发现了一条风景很美的路线，趁情人节天气好，带你飞一次。', null, null, null, true),
  ('baiqi', 62, '灯会', DATE '2022-02-15', '今年的灯会似乎有皮影戏表演，我也有点期待。', null, null, null, true),
  ('baiqi', 63, '双人解谜', DATE '2022-03-14', '双人限定解谜游戏门票已收到。如果你把解谜大奖赢回来，我可以再要一个你的小奖励吗？', null, null, null, true),
  ('baiqi', 64, '特殊节点', DATE '2022-05-20', '其实不需要等到特殊的节点，你最想听的话，我会一直在你身边，反复说给你听。', null, null, null, true),
  ('baiqi', 65, '特殊任务', DATE '2022-06-01', '我今天的任务只有一个，守护你的童心。', null, null, null, true),
  ('baiqi', 66, '替代口味', DATE '2022-06-03', '送你的那盒粽子里有几种口味你不喜欢，我换了几个自己包的，尝尝看。', null, null, null, true),
  ('baiqi', 67, '热闹之后', DATE '2022-07-29', '我一直觉得过生日不需要那么声张，但这次的惊喜，我真的很喜欢。被许多人惦念的感觉，很幸福。这一切都是因为有你的存在，你让我觉得幸运。', null, null, null, true),
  ('baiqi', 68, '寄意', DATE '2022-08-04', '委托了一只特别的纸飞机带给你祝福。晚些时候打开窗，它应该会和风一起准时到达。', null, null, null, true),
  ('baiqi', 69, '跳月', DATE '2022-09-10', '听说有种习俗，是相爱的人在月圆时“跳月”，以表心意。虽然我不擅长跳舞，但可以带你离月亮再近一点。', null, null, null, true),
  ('baiqi', 70, '积木游行', DATE '2022-10-31', '我准备了一些模型，再加上你之前送我的那些，足够在家里办一场属于我们的盛大万圣晚会了，一定比参加游行更有意思。', null, null, null, true),
  ('baiqi', 71, '更久的以后', DATE '2022-12-20', '五年时间飞快，我们已经攒下了很多美好的回忆。但我不会满足，我会让我们更久的以后，拥有更多的美好。', null, null, null, true),
  ('baiqi', 72, '圣诞惊喜', DATE '2022-12-24', '我想向你预约今天的全部时间，但不止是想过一个圣诞节。我想用属于我的方式，给你准备一份特别的圣诞惊喜。', null, null, null, true),
  ('baiqi', 73, '新衣展示', DATE '2023-01-01', '参照你之前的意见，我买了几件衣服，趁着今天是我们新年的第一次逛街，能帮我看看“穿搭成果”吗？', null, null, null, true),
  ('baiqi', 74, '元宵香薰', DATE '2023-02-05', '看到手工店做元宵香薰的宣传感觉还不错，还能做芝麻味的，要不要一起试试？', null, null, null, true),
  ('baiqi', 75, '礼物超额', DATE '2023-02-14', '刚才在路边看到一个可爱的玩偶，我忍不住又买下来了，希望你不会觉得我今年的礼物有点“太多”。', null, null, null, true),
  ('baiqi', 76, '橘子烟花', DATE '2023-03-14', '我今天看到橘子皮可以简单做出烟花，试了试，效果确实不错，等会儿回家给你看。', null, null, null, true),
  ('baiqi', 77, '特别嘉宾', DATE '2023-05-20', '我找到一家小动物咖啡厅，和老板预定了“特殊待遇”，他承诺，让那些小动物做我们的约会嘉宾。', null, null, null, true),
  ('baiqi', 78, '童趣手环', DATE '2023-06-01', '我准备好来接你了，为了和今天的儿童节安排贴合，我买了一个阿童木的手环戴着，一会儿给你看。', null, null, null, true),
  ('baiqi', 79, '结绳牵意', DATE '2023-06-22', '照着教程尝试做了一对五色手绳，但总觉得不够好看。不如今晚你过来帮我看看，我们一起优化一下。', null, null, null, true),
  ('baiqi', 80, '最幸运的事', DATE '2023-07-29', '在每年的时光中，我们似乎都在慢慢改变着。但经历了这些变化，我依旧坚定不移地被你选择，这是最幸运的事情。', null, null, null, true),
  ('baiqi', 81, '星河', DATE '2023-08-22', '听说在今夜，银河会在夜空搭起桥梁。你准备好和我一起，前往属于我们的那片星空了吗？', null, null, null, true),
  ('baiqi', 82, '悄悄许愿', DATE '2023-09-29', '不用担心月亮听不清你的愿望，晚上我带你抄近路，去它耳边说悄悄话。', null, null, null, true),
  ('baiqi', 83, '纸箱小狗', DATE '2023-10-31', '恶魔版的纸箱小狗我做好了，还按你的建议给它加了个毛茸茸的耳朵，确实可爱。等万圣节巡游的时候，我们把它也带上。', null, null, null, true),
  ('baiqi', 84, '未来记号', DATE '2023-12-20', '虽然我觉得每个有你的日子都值得纪念，但也还是想把今天作为标记，提醒自己要让你比之前每一年更幸福。', null, null, null, true),
  ('baiqi', 85, '定制节日', DATE '2023-12-24', '之前在街上看到了不错的定制手工店，要不要趁着休息的时候一起过去，定制只属于我们的圣诞装饰。', null, null, null, true),
  ('baiqi', 86, '专属席位', DATE '2024-01-01', '关于新年的烟花秀我已经找好位置了，不用提前预约，因为天空是我们的专属席位。', null, null, null, true),
  ('baiqi', 87, '手工丁香', DATE '2024-02-14', '按照教程把家里落了瓣的丁香花做成了摆件，上面还喷了你送给我的香水，应该很适合当做今天的礼物。', null, null, null, true),
  ('baiqi', 88, '动物灯笼', DATE '2024-02-24', '看着街边的路灯杆全都挂上了可爱的小动物灯笼，我在你家门前也装了只小狼灯笼，这样你走夜路回家时也不会害怕了。', null, null, null, true),
  ('baiqi', 89, '新旧纪念', DATE '2024-03-14', '原来你重印过去的照片，是为了做纪念立体书？这周末我们可以回趟学校，在旧地点再拍一次照片，一起加进书里。', null, null, null, true),
  ('baiqi', 90, '特殊助力', DATE '2024-05-20', '今天的天很蓝，适合去你一直想去的那个风车庄园……不用担心风车不转，今天所有的风都会眷顾我们的。', null, null, null, true),
  ('baiqi', 91, '胜券在握', DATE '2024-06-01', '隔壁公园办了2v2水枪小组赛，冠军奖品是一套双人街机。我们去一起赢回来。', null, null, null, true),
  ('baiqi', 92, '遥遥粽香', DATE '2024-06-08', '执行任务前吃了你做的冰皮粽子，很解暑。我会带着这份清凉，早点完成工作。', null, null, null, true),
  ('baiqi', 93, '不设终点的旅行', DATE '2024-07-29', '生活之外，你始终能给我带来全新的风景。乘着列车去看极昼，没有比这更“满分”的生日旅行。或许以后我们可以多出去走走，未来就是不设终点的旅行。', null, null, null, true),
  ('baiqi', 94, '小小使者', DATE '2024-08-10', '来见你的路上一直有一只喜鹊在我前面“带路”，它应该是月老派来指引我找到心爱女孩的使者。', null, null, null, true),
  ('baiqi', 95, '礼物置换', DATE '2024-09-15', '虽然我不太擅长灯谜，但游园会里还有投壶和射击比赛，你想要什么就告诉我，指哪打哪。', null, null, null, true),
  ('baiqi', 96, '烤烤可爱鬼', DATE '2024-10-31', '黄油小饼干的模具都准备好了，有乌鸦、蜘蛛，还有你“点名”的小幽灵，等你回来，我们一起把它们“变出来”。', null, null, null, true),
  ('baiqi', 97, '圆满纪念', DATE '2024-12-20', '在这样一座城市里，无论我在哪，都会想到你幸福的样子。', null, null, null, true),
  ('baiqi', 98, '圣诞新衣', DATE '2024-12-24', '听从长官小姐指令，家里的玩偶都已经换好了圣诞新衣。还有一套情侣装，等你回来跟我一起试穿。', null, null, null, true),
  ('baiqi', 99, '年货礼盒', DATE '2025-01-01', '我DIY了一个年货礼盒，有衣服、口红、首饰和你最喜欢的小零食和其他小礼品。独此一份，送货上门。', null, null, null, true),
  ('baiqi', 100, '辣味元宵', DATE '2025-02-12', '我们常去的那家餐馆推出了辣味元宵挑战，听说成功还会有特别奖励，晚上接你下班后正好一起过去试试。', null, null, null, true),
  ('baiqi', 101, '幸福纸飞机', DATE '2025-02-14', '恋语广场有一个情人节活动，把自己和爱人的名字写在纸飞机上投出去，飞得越远越幸福。我写的那个拿了第一。', null, null, null, true),
  ('baiqi', 102, '情侣券', DATE '2025-03-14', '收到了你准备的情侣券，我看上面没说限制一天几张，那我申请今天使用亲亲券、约会券和双人天空邀游券。', null, null, null, true),
  ('baiqi', 103, '无尽路途', DATE '2025-05-20', '虽然没拿到情侣马拉松赛奖牌，但我们欣赏了一路的云朵和浪花，这些都比名次更让人高兴。', null, null, null, true),
  ('baiqi', 104, '赢给你看', DATE '2025-05-31', '特遣署今年举办了趣味龙舟赛，给你留了最佳观赛位，保证你全程都能看到我。', null, null, null, true),
  ('baiqi', 105, '玩具四驱车', DATE '2025-06-01', '逛超市的时候买了个小时候玩的组装四驱车，它现在已经赶超小小小黑，变成家里速度最快的小成员了。', null, null, null, true),
  ('baiqi', 106, '明天过后', DATE '2025-07-29', '今天是个圆满的句点，也是个全新的起点。之后我还有很多歌想和你一起唱，有很多“福”要跟你分享。', null, null, null, true),
  ('baiqi', 107, '绒绒心迹', DATE '2025-08-29', '报告，已经在家里的“乞巧台”上放好了毛绒花灯和毛绒点心。今晚我去玩具店再带一对毛绒喜鹊回来，跟你过一个最可爱也最柔软的七夕。', null, null, null, true),
  ('baiqi', 108, '唾手可得', DATE '2025-10-06', '晚上去公园新铺的夜光银河小路看看吗？星星月亮都在身边，不用飞到天上，就能够到一切圆满。', null, null, null, true),
  ('baiqi', 109, '清晨第一吓', DATE '2025-10-31', '早上被“吓到”，不是因为你披着床单扮鬼，是没睡醒的时候伸手发现没捞到你。', null, null, null, true),
  ('baiqi', 110, '宇宙见证', DATE '2025-12-20', '就让整个宇宙来见证我与你永不完结的初恋。', null, null, null, true),
  ('baiqi', 111, '未竟之事', DATE '2025-12-24', '记得以前的圣诞节流行给喜欢的女孩送平安果，我就买了两份，一份请现在的你收下，一份请你替高中的你收下。', null, null, null, true),
  ('baiqi', 112, '新年气象', DATE '2026-01-01', '我和小黑都喜欢你买的新年新衣，作为感谢，想邀请你一起兜兜风。', null, null, null, true),
  ('baiqi', 113, '情歌金曲', DATE '2026-02-14', '上次吃饭时你说很喜欢餐厅老板放的情歌，我淘来了一盘原装磁带，晚上我们一边吹着晚风一边安静地听吧。', null, null, null, true),
  ('baiqi', 114, '今宵游戏', DATE '2026-03-03', '早上路过广场，看到社区在布置套圈游戏，说是可以“套福”。今晚回家时试试，把一年份的福气都套回去给你。', null, null, null, true),
  ('baiqi', 115, '树叶手环', DATE '2026-03-14', '今天编的彩色树叶手环有飞飞的功劳，虽然过程有点艰难，但成品还不错，一会儿回来送给你。', null, null, null, true),
  ('baiqi', 116, '海风记忆', DATE '2026-05-20', '我把我们捡到的贝壳做成了风铃，虽然不够精美，但有风经过时，那片海会再次来到我们身边。', null, null, null, true),
  ('baiqi', 117, '见义勇为', DATE '2026-06-01', '顺手捞回了玩具店老板意外被放飞的气球，他坚持要送我两只表达感谢，选了两个你会喜欢的，一会牵回家。', null, null, null, true),
  ('baiqi', 118, '甜蜜护送', DATE '2026-06-19', '食堂新出的冰激凌水晶粽，我已经从办公室的小冰箱转运回家了，护送任务圆满完成，等待“长官”检阅。', null, null, null, true),
  ('baiqi', 119, '明月所向', DATE '2026-07-29', '天空很高、很远，但也让我与月亮离得更近。我只愿向着你飞翔，也只想朝着你降落。', null, null, null, true),
  ('baiqi', 120, '星河追觅', DATE '2026-08-19', '最近几日晚上的天津四格外明亮。古人都说，它是横渡银河的渡口。或许连宇宙，也会为彼此奔赴的人留下一条相见的路。', null, null, null, true),
  ('baiqi', 121, '月圆之约', DATE '2026-09-25', '帮你在小吃街扫货时，炸货铺老板说他炸的麻球保证和今晚的月亮一样又大又圆，晚上赏月我们一起看看是不是名副其实。', null, null, null, true),
  ('baiqi', 122, '七只幽灵', DATE '2026-10-31', '你昨晚藏在家里的七只幽灵蛋糕，已经全部找到。今晚我们一起 “消灭” 这些战利品？', null, null, null, true)
on conflict (
  character_key,
  title,
  mail_date
)
do update set
  source_no = excluded.source_no,
  original_text = excluded.original_text,
  updated_at = now();

