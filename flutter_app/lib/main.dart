import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

const remoteDatabaseUrl =
    'https://raw.githubusercontent.com/higorbrito1/cfp2026/main/flutter_app/assets/data/ctb-mbft.json';

void main() => runApp(const CfpMultasApp());

class FineRecord {
  FineRecord(this.data);
  final Map<String, dynamic> data;

  String get id => '${data['id'] ?? ''}';
  String get title => '${data['title'] ?? data['summary'] ?? ''}';
  String get article => '${data['article'] ?? ''}';
  String get severity => '${data['severity'] ?? ''}';
  String get summary => '${data['summary'] ?? ''}';
  String value(String key) => '${data[key] ?? ''}'.trim();
}

class CfpMultasApp extends StatelessWidget {
  const CfpMultasApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'CFP 2026 · Multas CTB',
      theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
              seedColor: const Color(0xff1a5c47), brightness: Brightness.light),
          useMaterial3: true),
      home: const FineHomePage(),
    );
  }
}

class FineHomePage extends StatefulWidget {
  const FineHomePage({super.key});

  @override
  State<FineHomePage> createState() => _FineHomePageState();
}

class _FineHomePageState extends State<FineHomePage> {
  final searchController = TextEditingController();
  List<FineRecord> records = [];
  Set<String> favorites = {};
  String query = '';
  String severityFilter = 'Todas';
  String databaseVersion = 'Base incluída no app';
  bool loading = true;
  bool updating = false;

  @override
  void initState() {
    super.initState();
    _loadDatabase();
  }

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  Future<void> _loadDatabase() async {
    final preferences = await SharedPreferences.getInstance();
    final saved = preferences.getString('ctb_mbft_database');
    final raw =
        saved ?? await rootBundle.loadString('assets/data/ctb-mbft.json');
    final decoded = (jsonDecode(raw) as List).cast<Map<String, dynamic>>();
    if (!mounted) return;
    setState(() {
      records = decoded.map(FineRecord.new).toList();
      databaseVersion = preferences.getString('ctb_mbft_version') ??
          (saved == null ? 'Base incluída no app' : 'Base atualizada');
      loading = false;
    });
  }

  Future<void> _updateDatabase() async {
    setState(() => updating = true);
    try {
      final response = await http.get(Uri.parse(remoteDatabaseUrl));
      if (response.statusCode != 200) {
        throw Exception('Servidor respondeu ${response.statusCode}');
      }
      final decoded =
          (jsonDecode(response.body) as List).cast<Map<String, dynamic>>();
      final preferences = await SharedPreferences.getInstance();
      await preferences.setString('ctb_mbft_database', response.body);
      final stamp =
          'Atualizada em ${DateTime.now().toLocal().toString().substring(0, 16)}';
      await preferences.setString('ctb_mbft_version', stamp);
      if (!mounted) return;
      setState(() {
        records = decoded.map(FineRecord.new).toList();
        databaseVersion = stamp;
      });
      _showMessage('Base atualizada com ${decoded.length} fichas.');
    } catch (error) {
      if (mounted) {
        _showMessage(
          'Não foi possível atualizar. A base offline continua disponível.',
        );
      }
    } finally {
      if (mounted) setState(() => updating = false);
    }
  }

  void _showMessage(String message) => ScaffoldMessenger.of(context)
      .showSnackBar(SnackBar(content: Text(message)));

  List<FineRecord> get filteredRecords {
    final tokens =
        normalize(query).split(' ').where((token) => token.isNotEmpty).toList();
    return records.where((fine) {
      final matchesSeverity = severityFilter == 'Todas' ||
          normalize(fine.severity) == normalize(severityFilter);
      final searchable = normalize(fine.data.values.join(' '));
      return matchesSeverity && tokens.every(searchable.contains);
    }).toList();
  }

  String normalize(String value) => value
      .toLowerCase()
      .replaceAll(RegExp(r'[áàãâä]'), 'a')
      .replaceAll(RegExp(r'[éèêë]'), 'e')
      .replaceAll(RegExp(r'[íìîï]'), 'i')
      .replaceAll(RegExp(r'[óòõôö]'), 'o')
      .replaceAll(RegExp(r'[úùûü]'), 'u')
      .replaceAll(RegExp(r'[^a-z0-9]+'), ' ')
      .trim();

  void _openDetails(FineRecord fine) {
    showDialog<void>(
        context: context, builder: (context) => FineDetailsDialog(fine: fine));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Multas do CTB/MBFT'),
        actions: [
          IconButton(
            onPressed: updating ? null : _updateDatabase,
            icon: updating
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.sync),
            tooltip: 'Atualizar base',
          ),
        ],
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  child: TextField(
                    controller: searchController,
                    onChanged: (value) => setState(() => query = value),
                    decoration: InputDecoration(
                      labelText: 'Pesquisar infração',
                      hintText: 'Artigo, código, CNH, abordagem...',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: query.isEmpty
                          ? null
                          : IconButton(
                              onPressed: () {
                                searchController.clear();
                                setState(() => query = '');
                              },
                              icon: const Icon(Icons.clear),
                            ),
                      border: const OutlineInputBorder(),
                    ),
                  ),
                ),
                SizedBox(
                  height: 48,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: ['Todas', 'Gravíssima', 'Grave', 'Média', 'Leve']
                        .map(
                          (filter) => Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ChoiceChip(
                              label: Text(filter),
                              selected: severityFilter == filter,
                              onSelected: (_) =>
                                  setState(() => severityFilter = filter),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ),
                Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: Row(
                    children: [
                      Text('${filteredRecords.length} resultados'),
                      const Spacer(),
                      Text(databaseVersion,
                          style: Theme.of(context).textTheme.labelSmall),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filteredRecords.length,
                    itemBuilder: (context, index) {
                      final fine = filteredRecords[index];
                      return FineCard(
                        fine: fine,
                        favorite: favorites.contains(fine.id),
                        onTap: () => _openDetails(fine),
                        onFavorite: () => setState(() {
                          favorites.contains(fine.id)
                              ? favorites.remove(fine.id)
                              : favorites.add(fine.id);
                        }),
                      );
                    },
                  ),
                ),
              ],
            ),
    );
  }
}

class FineCard extends StatelessWidget {
  const FineCard(
      {required this.fine,
      required this.favorite,
      required this.onTap,
      required this.onFavorite,
      super.key});
  final FineRecord fine;
  final bool favorite;
  final VoidCallback onTap;
  final VoidCallback onFavorite;

  @override
  Widget build(BuildContext context) => Card(
      child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Text('${fine.id} · ${fine.article}',
                          style: Theme.of(context)
                              .textTheme
                              .labelMedium
                              ?.copyWith(
                                  color: const Color(0xff1a5c47),
                                  fontWeight: FontWeight.bold)),
                      const Spacer(),
                      IconButton(
                          onPressed: onFavorite,
                          icon: Icon(favorite ? Icons.star : Icons.star_border),
                          tooltip: 'Favorito')
                    ]),
                    Text(fine.title,
                        style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: 8),
                    Text('${fine.value('penalty')} · ${fine.value('points')}',
                        style: Theme.of(context).textTheme.bodySmall),
                    const SizedBox(height: 8),
                    const Text('Abrir ficha completa →',
                        style: TextStyle(
                            color: Color(0xff1a5c47),
                            fontWeight: FontWeight.bold,
                            fontSize: 12))
                  ]))));
}

class FineDetailsDialog extends StatelessWidget {
  const FineDetailsDialog({required this.fine, super.key});
  final FineRecord fine;

  @override
  Widget build(BuildContext context) => AlertDialog(
      scrollable: true,
      title: Text('${fine.id} · ${fine.article}'),
      content: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(fine.title, style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 6),
        Text(fine.summary),
        const SizedBox(height: 14),
        ...[
          ['Gravidade', 'severity'],
          ['Pontuação', 'points'],
          ['Penalidade', 'penalty'],
          ['Medida administrativa', 'measure'],
          ['Infrator', 'offender'],
          ['Constatação', 'detection'],
          ['Crime de trânsito', 'crime'],
          ['Competência', 'competence']
        ].map((item) => _field(item[0], fine.value(item[1]))),
        ...[
          ['Quando autuar', 'whenToAutuate'],
          ['Quando não autuar', 'whenNotToAutuate'],
          ['Definições e procedimentos', 'procedures'],
          ['Exemplos para observações do AIT', 'examples'],
          ['Informações complementares', 'additional']
        ].where((item) => fine.value(item[1]).isNotEmpty).map((item) =>
            ExpansionTile(
                title: Text(item[0]),
                tilePadding: EdgeInsets.zero,
                children: [
                  Align(
                      alignment: Alignment.centerLeft,
                      child: Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Text(fine.value(item[1]))))
                ]))
      ]));

  Widget _field(String label, String value) => Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label,
            style: const TextStyle(
                fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
        Text(value.isEmpty ? 'Não informado na ficha' : value)
      ]));
}
