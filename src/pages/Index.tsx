import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const Index = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const modules = [
    { id: 'dashboard', name: 'Главная панель', icon: 'LayoutDashboard' },
    { id: 'analysis', name: 'Анализ преступления', icon: 'FileSearch' },
    { id: 'database', name: 'База законодательства', icon: 'BookOpen' },
    { id: 'reports', name: 'Отчёты', icon: 'BarChart3' },
  ];

  const ukRfArticles = [
    { num: '105', title: 'Убийство', category: 'Преступления против жизни и здоровья', severity: 'Особо тяжкое' },
    { num: '158', title: 'Кража', category: 'Преступления против собственности', severity: 'Средней тяжести' },
    { num: '159', title: 'Мошенничество', category: 'Преступления против собственности', severity: 'Средней тяжести' },
    { num: '161', title: 'Грабёж', category: 'Преступления против собственности', severity: 'Тяжкое' },
    { num: '162', title: 'Разбой', category: 'Преступления против собственности', severity: 'Тяжкое' },
    { num: '228', title: 'Незаконные приобретение, хранение, перевозка, изготовление наркотических средств', category: 'Преступления против здоровья населения', severity: 'Тяжкое' },
    { num: '264', title: 'Нарушение правил дорожного движения', category: 'Преступления против безопасности движения', severity: 'Средней тяжести' },
  ];

  const upkRfArticles = [
    { num: '73', title: 'Обстоятельства, подлежащие доказыванию', category: 'Доказательства и доказывание' },
    { num: '146', title: 'Возбуждение уголовного дела', category: 'Досудебное производство' },
    { num: '171', title: 'Следственные действия', category: 'Предварительное расследование' },
    { num: '307', title: 'Приговор суда', category: 'Судебное разбирательство' },
  ];

  const constitutionArticles = [
    { num: '2', title: 'Человек, его права и свободы являются высшей ценностью', category: 'Основы конституционного строя' },
    { num: '19', title: 'Равенство перед законом и судом', category: 'Права и свободы человека и гражданина' },
    { num: '49', title: 'Презумпция невиновности', category: 'Права и свободы человека и гражданина' },
    { num: '51', title: 'Право не свидетельствовать против себя', category: 'Права и свободы человека и гражданина' },
  ];

  const recentAnalyses = [
    { id: 1, date: '23.01.2026', type: 'Кража (ст. 158 УК РФ)', status: 'Завершён', officer: 'Иванов И.И.' },
    { id: 2, date: '23.01.2026', type: 'Грабёж (ст. 161 УК РФ)', status: 'В обработке', officer: 'Петров П.П.' },
    { id: 3, date: '22.01.2026', type: 'Мошенничество (ст. 159 УК РФ)', status: 'Завершён', officer: 'Сидоров С.С.' },
  ];

  const handleAnalyze = () => {
    toast.success('Анализ запущен', {
      description: 'Система обрабатывает данные преступления'
    });
  };

  const handleExport = () => {
    toast.success('Отчёт формируется', {
      description: 'Файл будет готов через несколько секунд'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex">
        <aside className="w-72 min-h-screen bg-secondary text-white p-6 shadow-xl">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
                <Icon name="Shield" size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">МВД России</h1>
                <p className="text-xs text-slate-300">Система анализа</p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {modules.map((module) => (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeModule === module.id
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-slate-300 hover:bg-secondary/80 hover:text-white'
                }`}
              >
                <Icon name={module.icon} size={20} />
                <span className="font-medium">{module.name}</span>
              </button>
            ))}
          </nav>

          <Separator className="my-6 bg-slate-600" />

          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-secondary/80 hover:text-white transition-all">
              <Icon name="Settings" size={20} />
              <span className="font-medium">Настройки</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-secondary/80 hover:text-white transition-all">
              <Icon name="LogOut" size={20} />
              <span className="font-medium">Выход</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {activeModule === 'dashboard' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-secondary mb-2">Главная панель</h2>
                  <p className="text-slate-600">Система автоматизированного анализа преступлений</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="hover-scale cursor-pointer border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Icon name="FileSearch" size={32} className="text-primary" />
                        <Badge variant="secondary">24</Badge>
                      </div>
                      <CardTitle className="text-xl">Анализов за день</CardTitle>
                      <CardDescription>Обработано материалов</CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="hover-scale cursor-pointer border-l-4 border-l-green-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Icon name="BookOpen" size={32} className="text-green-600" />
                        <Badge variant="secondary">1847</Badge>
                      </div>
                      <CardTitle className="text-xl">Статей в базе</CardTitle>
                      <CardDescription>УК РФ, УПК РФ, Конституция</CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="hover-scale cursor-pointer border-l-4 border-l-orange-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Icon name="BarChart3" size={32} className="text-orange-600" />
                        <Badge variant="secondary">156</Badge>
                      </div>
                      <CardTitle className="text-xl">Отчётов создано</CardTitle>
                      <CardDescription>За текущий месяц</CardDescription>
                    </CardHeader>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Clock" size={20} />
                      Последние анализы
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentAnalyses.map((analysis) => (
                        <div
                          key={analysis.id}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-secondary">{analysis.type}</p>
                            <p className="text-sm text-slate-600">Сотрудник: {analysis.officer}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-500">{analysis.date}</span>
                            <Badge variant={analysis.status === 'Завершён' ? 'default' : 'secondary'}>
                              {analysis.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeModule === 'analysis' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-secondary mb-2">Анализ преступления</h2>
                  <p className="text-slate-600">Автоматизированная классификация и квалификация</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Данные о преступлении</CardTitle>
                    <CardDescription>Заполните форму для проведения анализа</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="case-number">Номер дела</Label>
                        <Input id="case-number" placeholder="Введите номер дела" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">Дата происшествия</Label>
                        <Input id="date" type="date" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Категория преступления</Label>
                      <Select>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Выберите категорию" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="property">Преступления против собственности</SelectItem>
                          <SelectItem value="life">Преступления против жизни и здоровья</SelectItem>
                          <SelectItem value="public">Преступления против общественной безопасности</SelectItem>
                          <SelectItem value="economic">Преступления в сфере экономики</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Описание обстоятельств</Label>
                      <Textarea
                        id="description"
                        placeholder="Подробное описание события преступления, обстоятельств, лиц, участвовавших в деянии..."
                        rows={6}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="evidence">Доказательства</Label>
                      <Textarea
                        id="evidence"
                        placeholder="Перечислите имеющиеся доказательства, показания свидетелей, вещественные доказательства..."
                        rows={4}
                      />
                    </div>

                    <Button onClick={handleAnalyze} className="w-full" size="lg">
                      <Icon name="Search" size={20} className="mr-2" />
                      Провести анализ
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeModule === 'database' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-secondary mb-2">База законодательства РФ</h2>
                  <p className="text-slate-600">Актуальная редакция кодексов с функцией поиска</p>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          placeholder="Поиск по номеру статьи или ключевым словам..."
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Button variant="outline">
                        <Icon name="Filter" size={20} className="mr-2" />
                        Фильтры
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="uk">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="uk">УК РФ</TabsTrigger>
                        <TabsTrigger value="upk">УПК РФ</TabsTrigger>
                        <TabsTrigger value="const">Конституция РФ</TabsTrigger>
                      </TabsList>

                      <TabsContent value="uk" className="space-y-4">
                        <ScrollArea className="h-[500px] pr-4">
                          {ukRfArticles.map((article) => (
                            <Card key={article.num} className="mb-3 hover:shadow-md transition-shadow cursor-pointer">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="outline" className="font-mono">
                                        Ст. {article.num}
                                      </Badge>
                                      <Badge variant={article.severity === 'Особо тяжкое' ? 'destructive' : 'secondary'}>
                                        {article.severity}
                                      </Badge>
                                    </div>
                                    <CardTitle className="text-lg">{article.title}</CardTitle>
                                    <CardDescription className="mt-1">{article.category}</CardDescription>
                                  </div>
                                  <Icon name="ChevronRight" size={20} className="text-slate-400 mt-1" />
                                </div>
                              </CardHeader>
                            </Card>
                          ))}
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="upk" className="space-y-4">
                        <ScrollArea className="h-[500px] pr-4">
                          {upkRfArticles.map((article) => (
                            <Card key={article.num} className="mb-3 hover:shadow-md transition-shadow cursor-pointer">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <Badge variant="outline" className="font-mono mb-2">
                                      Ст. {article.num}
                                    </Badge>
                                    <CardTitle className="text-lg">{article.title}</CardTitle>
                                    <CardDescription className="mt-1">{article.category}</CardDescription>
                                  </div>
                                  <Icon name="ChevronRight" size={20} className="text-slate-400 mt-1" />
                                </div>
                              </CardHeader>
                            </Card>
                          ))}
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="const" className="space-y-4">
                        <ScrollArea className="h-[500px] pr-4">
                          {constitutionArticles.map((article) => (
                            <Card key={article.num} className="mb-3 hover:shadow-md transition-shadow cursor-pointer">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <Badge variant="outline" className="font-mono mb-2">
                                      Ст. {article.num}
                                    </Badge>
                                    <CardTitle className="text-lg">{article.title}</CardTitle>
                                    <CardDescription className="mt-1">{article.category}</CardDescription>
                                  </div>
                                  <Icon name="ChevronRight" size={20} className="text-slate-400 mt-1" />
                                </div>
                              </CardHeader>
                            </Card>
                          ))}
                        </ScrollArea>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Icon name="RefreshCw" size={24} className="text-primary" />
                      <div>
                        <CardTitle>Автоматическое обновление</CardTitle>
                        <CardDescription className="text-slate-700">
                          Последнее обновление: 15.01.2026 | Следующее: 01.02.2026
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>
            )}

            {activeModule === 'reports' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-secondary mb-2">Формирование отчётов</h2>
                  <p className="text-slate-600">Аналитика и статистика по проведённым анализам</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Статистика по категориям</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Против собственности</span>
                            <span className="font-semibold">42%</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: '42%' }}></div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Против жизни и здоровья</span>
                            <span className="font-semibold">28%</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: '28%' }}></div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Экономические преступления</span>
                            <span className="font-semibold">18%</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: '18%' }}></div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Прочие</span>
                            <span className="font-semibold">12%</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-400 rounded-full" style={{ width: '12%' }}></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Динамика по месяцам</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-end justify-between gap-2 h-32">
                          <div className="flex-1 bg-primary rounded-t" style={{ height: '45%' }}></div>
                          <div className="flex-1 bg-primary rounded-t" style={{ height: '62%' }}></div>
                          <div className="flex-1 bg-primary rounded-t" style={{ height: '55%' }}></div>
                          <div className="flex-1 bg-primary rounded-t" style={{ height: '78%' }}></div>
                          <div className="flex-1 bg-primary rounded-t" style={{ height: '85%' }}></div>
                          <div className="flex-1 bg-primary rounded-t" style={{ height: '100%' }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Авг</span>
                          <span>Сен</span>
                          <span>Окт</span>
                          <span>Ноя</span>
                          <span>Дек</span>
                          <span>Янв</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Экспорт отчётов</CardTitle>
                    <CardDescription>Выберите формат для выгрузки данных</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button onClick={handleExport} variant="outline" className="h-24 flex flex-col gap-2">
                        <Icon name="FileText" size={32} className="text-primary" />
                        <span>PDF отчёт</span>
                      </Button>
                      <Button onClick={handleExport} variant="outline" className="h-24 flex flex-col gap-2">
                        <Icon name="FileSpreadsheet" size={32} className="text-green-600" />
                        <span>Excel таблица</span>
                      </Button>
                      <Button onClick={handleExport} variant="outline" className="h-24 flex flex-col gap-2">
                        <Icon name="Database" size={32} className="text-orange-600" />
                        <span>Данные JSON</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
