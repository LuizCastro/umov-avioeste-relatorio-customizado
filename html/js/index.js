async function getdata(task) {
    loading();
    if (task == undefined || task == '') {
        setNoData(task);
    }
    var url = `https://trlvvv52244il555u3yfuqampe0lulvd.lambda-url.us-east-1.on.aws/?pedido=${task}`;
    $.ajax({
        url: url,
        type: 'GET',
        crossDomain: true,
        contentType: 'application/json',
        success: function (response) {
            if (response.error || response.cabecalho == {}) {
                setNoData(task, 'falha ao carregar pedido, verifique o numero e tente novamente');
            }

            setData(response);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            loading();
            setNoData(task, 'falha ao carregar pedido, tente novamente');
        }
    });
}

function carregarComponentHTML(id, arquivo) {
    let body = document.getElementById('body');
    fetch(arquivo)
        .then(res => res.text())
        .then(html => {
            body.innerHTML += html;
        });
}

const formatPhone = (value) => {
    if (!value) return "";
    // Remove todos os caracteres não numéricos
    value = value.replace(/\D/g, '');
    if (value.length === 11) {
        value = value.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (value.length === 10) {
        value = value.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    } else if (value.length === 13) {
        value = value.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, "+$1 ($2) $3-$4");
    }
    return value;
};
const formatCEP = (value) => {
    if (!value) return "";
    // Remove todos os caracteres não numéricos
    value = value.replace(/\D/g, '');

    // Aplica a máscara 99999-999
    if (value.length === 8) {
        value = value.replace(/(\d{5})(\d{3})/, "$1-$2");
    }
    return value;
};

const formatCPFCNPF = (value) => {
    if (!value) return "";
    // Remove todos os caracteres não numéricos
    value = value.replace(/\D/g, '');
    // CPF Aplica a máscara 999.999.999-99
    if (value.length === 11) {
        // Celular com 9 na frente
        value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    // CNPJ Aplica a máscara 99.999.999/9999-99
    else if (value.length === 14) {
        // Fixo ou celular antigo
        value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }

    return value;
};

function loading() {
    const spinner = document.getElementById('loading-spinner');
    spinner.style.display = spinner.style.display == 'flex' ? 'none' : 'flex';
}

function setNoData(task, message) {
    document.getElementById('body').innerHTML = `
    <div class="alert alert warning">Pedido :${task} não encontrado , ${message} </div>;
    `;
}
function setData(data) {
    //loading();
    addCabecalho(data.pedido, data.cabecalho);
    addDadosCliente(data.dadosCliente);
    addParticipantes(data.participantes);
    addInformacoesPreliminares(data.informacoesPreliminares);
    addCondideracaorIniciais(data.informacoesPreliminares);
    addFotoPadrao(data.informacoesPreliminares);
    addSecao(data.secoes);
    addAssinaturas(data.participantes);
    formataA4();
    loading();
}
function getHeader() {
    return `
    <tr class="page-report-head">
        <th>
            <table width="99%" class="border-rounded" cellpadding="0" cellspacing="0">
                <tbody class="border-none">
                    <tr class="border-none">
                        <td class="border-none" width="70%" align="left" class="fb-600 fs-20">CHECK LIST<BR><span
                                class="fb-800 fs-20">ENTREGA TÉCNICA</td>
                        <td class="border-none" width="30%" align="right"><img class="logo" src="img/logo.png"></td>
                    </tr>
                </tbody>
            </table>
        </th>
    </tr>`;
}

function getFooter() {
    return `
    <tr class="page-report-footer">
        <td class="plr-20">
            <table width="100%" class="border-rounded" cellpadding="0" cellspacing="0">
                <tbody class="border-none">
                    <tr class="border-none">
                        <td style="width:50%;" class="border-none" align="left">(49) 3664-8000</td>
                        <td style="width:50%;" class="border-none" align="left">ROD. BR KM 102,3 - LINHA HUMAITÁ -
                            INDUSTRIAL<br>CEP 89890-000 Cunha Porã / SC</td>
                    </tr>
                </tbody>
            </table>
        </td>
    </tr>`;
}

function addAssinaturas(data) {
    let totalAssinaturas = data.length;
    let indexAssinaturas = 0
    let _tds = '';
    let tr = '';
    for (let index = 1; index <= data.length; index++) {
        let participante = data[index - 1];
        _tds += `<td align="center" style="width:50%;">
                    <img src="${participante.Assinatura}" width="95%" height="auto">
                    <br><span class="label">Nome: ${participante.Nome} </span>
                    <br><span class="label">Empresa: ${participante.Empresa} </span>
        </td>`;
        if (index % 2 == 0 || index >= data.length) {
            _tr += `<tr>${_tds}</tr>`;
            _tds = '';
        }
    }
    tr += ` <tr class="page-report-content">
                <td class="pdt-10 plr-20 fotopadrao">
                    <span class="titulo-atividade">Assinaturas</span>
                    <table width="100%" class="fotopadrao">
                        <tbody>
                            ${_tr}
                        </tbody>
                    </table>
                </td>
            </tr>`;
    addContentTable(tr);
    tr = '';
}

function addSecao(secoes) {
    let secao = '';
    let fotos = '';
    let body = document.getElementById('body');
    for (const chave in secoes) {
        const secao = secoes[chave];
        let total = secao.itens.length;
        _secao = '';
        index = 0;
        _tr = '';
        _tds = '';
        _tr_tds = [];
        newLine = false;
        linha = 0;
        secao.itens.forEach(item => {
            index++;
            strinSize = item.descricao.length + item.valor.length + 2;
            if (!(linha in _tr_tds)) {
                _tr_tds[linha] = [];
            }
            if ((strinSize > 50) && linha > 0) {
                linha++;
                _tr_tds[linha] = [];
            }
            _tr_tds[linha].push({
                tamanho: strinSize, div: `
                    <div class="form-row">
                        <span class="label">${item.descricao}: </span>
                        <span class="underline-space" id="${item.campo}">${item.valor}</span>
                    </div>`});
            if (_tr_tds[linha].length > 1) {
                linha++;
            }
        });
        _tr_tds.forEach(linha => {
            _trtd = '';
            per = 100 / linha.length;
            colspan = linha.length == 1 ? 2 : 1;
            linha.forEach(td => {

                if (td.tamanho > 50) {
                    _tr += `<tr><td colspan="2" data-size="${td.tamanho}" style="width:100%"> ${td.div}</td></tr>`;
                } else {
                    _trtd += `<td colspan="${colspan}" data-size="${td.tamanho}" style="width:${per}%"> ${td.div}</td>`;
                }
            });
            _tr += `<tr>${_trtd}</tr>`;
        });

        //Seção
        _secao += `<tr class="page-report-content">
                    <td class="pdt-10 plr-20">
                        <span class="titulo-atividade">${secao.descricao}</span>
                        <table width="100%" class="border-rounded" cellpadding="0" cellspacing="0">
                            <tbody class="border-none">
                                <tr class="border-none">
                                    <td class="border-none" width="100%" align="left">
                                        <table width="100%" class=" m-t-0 m-b-0">
                                            ${_tr}
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </td >
                </tr> `;

        //Observações
        if (secao.observacao) {
            _secao += `<tr class="page-report-content">
                <td class="pdt-10 plr-20">
                    <span class="titulo-atividade">Observações</span>
                    <table width="100%" class="border-rounded" cellpadding="0" cellspacing="0">
                        <tbody class="border-none">
                            <tr class="border-none">
                                <td class="border-none" width="100%" align="left">
                                    <table width="100%" class=" m-t-0 m-b-0">
                                        <tr>
                                            <td style="width:100%;min-height: 40px;">
                                                <span id="largura" style="width: 100%; display: block;">${secao.observacao}</span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>`;
        }

        //Fotos Padrao
        let totalFotos = secao.fotos.length;
        indexFotos = 0;
        if (totalFotos > 0) {
            _tr = '';
            _tds = '';
            secao.fotos.forEach(foto => {
                indexFotos++;
                _tds += `<td align="center" style="width:50%;"><img src="${foto}" width="95%" height="auto"></td>`;
                if (indexFotos % 2 == 0 || indexFotos >= totalFotos) {
                    _tr += `<tr>${_tds}</tr>`;
                    _tds = '';
                }
            });
            _secao += `
            <tr class="page-report-content">
                <td class="pdt-10 plr-20 fotopadrao">
                    <span class="titulo-atividade">Foto Padrão</span>
                    <table width="100%" class="fotopadrao">
                        <tbody>
                            ${_tr}
                        </tbody>
                    </table>
                </td>
            </tr>`;
            _tr = '';
        }
        let page = `
        <div class="page">
            <table border=0 class="page-report-A4" width="100%">
                <tbody>${_secao}<tbody>
            </table>
        </div>`;
        addContentTable(_secao);
        _secao = '';
        page = '';
    }
}

function addContentTable(html) {

    let table = document.getElementById('content-page');
    table.innerHTML += html
    // table.insertAdjacentHTML('beforeend', html);
    // table.innerHTML(html);
}

function addCabecalho(pedido, data) {

    let tr = `<tr class="page-report-content">
                <td class="pdt-10 plr-20">
                    <span class="titulo-atividade"><label style="padding-top: 15px;">Cabeçalho</label></span>
                    <table width="100%" class="border-rounded" cellpadding="0" cellspacing="0">
                        <tbody class="border-none">
                            <tr class="border-none">
                                <td class="border-none" width="100%" align="left">
                                    <p class="m-t-0 m-b-0">
                                        <label>Número: </label> <span id="pedido">${pedido}</span><br>
                                        <label>Vendedor: </label><span id="vendedor">${data.vendedor}</span><br>
                                        <label>Categoria de Vendas: </label> <span id="categoriaVendas">${data.categoriaVendas}</span><br>
                                        <label>Integradora: </label> <span id="integradora">${data.integradora}</span><br>
                                        <label>Projeto: </label> <span id="projeto">${data.projeto}</span>
                                    </p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>`;
    addContentTable(tr);
    tr = '';
}

function addDadosCliente(data) {
    //Dados do Cliente
    tr = `<tr class="page-report-content">
        <td class="pdt-10 plr-20">
            <span class="titulo-atividade">Dados do Cliente</span>
            <table width="100%" class="border-rounded" cellpadding="0" cellspacing="0">
                <tbody class="border-none">
                    <tr class="border-none">
                        <td class="border-none" width="100%" align="left">
                            <table width="100%" class=" m-t-0 m-b-0">
                                <tr>
                                    <td style="width:100%" colspan="3">
                                        <div class="form-row">
                                            <span class="label">Cliente:</span>
                                            <span id="cpf">${data.cliente}</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width:100%" colspan="3">
                                        <div class="form-row">
                                            <span class="label">Endereço:</span>
                                            <span id="cpf">${data.endereco}</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width:40%">
                                    <div class="form-row">
                                            <span class="label">Município:</span>
                                            <span id="municipio">${data.municipio}</span>
                                    </div>
                                    <td style="width:30%">
                                        <div class="form-row">
                                                <span class="label">CEP:</span>
                                                <span id="cep">${formatCEP(data.cep)}</span>
                                        </div>
                                    <td style="width:30%">
                                        <div class="form-row">
                                                <span class="label">UF:</span>
                                                <span id="uf">${data.uf}</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width:40%">
                                        <div class="form-row">
                                            <span class="label">CPF:</span>
                                            <span id="cpf">${formatCPFCNPF(data.cpf)}</span>
                                        </div>
                                    </td>
                                    <td style="width:30%">
                                        <div class="form-row">
                                            <span class="label">IE:</span>
                                            <span id="ie">${data.ie}</span>
                                        </div>
                                    </td>
                                    <td style="width:30%">
                                        <div class="form-row">
                                            <span class="label">Contato:</span>
                                            <span id="contato">${data.contato}</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width:40%">
                                        <div class="form-row">
                                            <span class="label">Telefone:</span>
                                            <span id="telefone">${formatPhone(data.telefone)}</span>
                                        </div>
                                    </td>
                                    <td style="width:30%">
                                        <div class="form-row">
                                            <span class="label">Celular:</span>
                                            <span id="celular">${formatPhone(data.celular)}</span>
                                        </div>
                                    </td>
                                    <td></td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>
        </td>
    </tr>`;
    addContentTable(tr);
    tr = '';
}

function addParticipantes(data) {
    //Participantes
    tr = `<tr class="page-report-content">
        <td class="pdt-10 plr-20">
            <span class="titulo-atividade">Participantes</span>
            <table width="100%" class="border-rounded" cellpadding="0" cellspacing="0">
                <tbody class="border-none">
                    <tr class="border-none">
                        <td class="border-none" width="100%" align="left">
                            <table width="100%" class="m-t-0 m-b-0">`;

    for (let index = 1; index <= data.length; index++) {
        let idNome = `#participante_nome_${index} `;
        let idEmpresa = `#participante_empresa_${index} `;
        tr += `<tr>
                    <td style="width:50%;">
                        <div class="form-row">
                            <span class="label">Nome:</span>
                            <span class="underline-space" id="${idNome}">${data[index - 1].Nome}</span>
                        </div>
                    </td>
                    <td style="width:50%;">
                        <div class="form-row">
                            <span class="label">Empresa:</span>
                            <span class="underline-space" id="${idEmpresa}">${data[index - 1].Empresa}</span>
                        </div>
                    </td>
                </tr>`;
    }
    tr += `</table></td></tr></tbody></table></td></tr>`;
    addContentTable(tr);
    tr = '';
}

function addInformacoesPreliminares(data) {
    tr = `<tr class="page-report-content">
                <td class="pdt-10 plr-20">
                    <span class="titulo-atividade">Informações Preliminares</span>
                    <table width="100%" class="border-rounded" cellpadding="0" cellspacing="0">
                        <tbody class="border-none">
                            <tr class="border-none">
                                <td class="border-none" width="100%" align="left">
                                    <table width="100%" class=" m-t-0 m-b-0">
                                        <tr>
                                            <td style="width:33.33%;">
                                                <div class="form-row">
                                                    <span class="label">Largura: </span>
                                                    <span class="underline-space" id="largura">${data.largura ?? ''}</span>
                                                </div>
                                            </td>
                                            <td style="width:33.33%;">
                                                <div class="form-row">
                                                    <span class="label">Energia: </span>
                                                    <span class="underline-space" id="energia">${data.energia ?? ''}</span>
                                                </div>
                                            </td>
                                            <td style="width:33.33%;">
                                                <div class="form-row">
                                                    <span class="label">Tipo de construção: </span>
                                                    <span class="underline-space" id="tipo_construcao">${data.tipo_construcao ?? ''}</span>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="width:33.33%;">
                                                <div class="form-row">
                                                    <span class="label">Comprimento: </span>
                                                    <span class="underline-space" id="comprimento">${data.comprimento ?? ''}</span>
                                                </div>
                                            </td>
                                            <td style="width:33.33%;">
                                                <div class="form-row">
                                                    <span class="label">Veloc. de ar desejada: </span>
                                                    <span class="underline-space" id="velocidade_ar_desejada">${data.velocidade_ar_desejada ?? ''}</span>
                                                </div>
                                            </td>
                                            <td style="width:33.33%;">
                                                <div class="form-row">
                                                    <span class="label">Estrutura muréta: </span>
                                                    <span class="underline-space" id="estrutura_mureta">${data.estrutura_mureta ?? ''}</span>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="width:33.33%;">
                                                <div class="form-row">
                                                    <span class="label">Altura Central: </span>
                                                    <span class="underline-space" id="altura_central">${data.altura_central ?? ''}</span>
                                                </div>
                                            </td>
                                            <td style="width:33.33%;">
                                                <div class="form-row">
                                                    <span class="label">Pressão de trabalho: </span>
                                                    <span class="underline-space" id="pressao_trabalho">${data.pressao_trabalho ?? ''}</span>
                                                </div>
                                            </td>
                                            <td style="width:33.33%;">
                                                <div class="form-row">
                                                    <span class="label">Dist. entre galpão: </span>
                                                    <span class="underline-space" id="distancia_entre_galpoes">${data.distancia_entre_galpoes ?? ''}</span>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="width:33.33%;">
                                                <div class="form-row">
                                                    <span class="label">Altura Lateral: </span>
                                                    <span class="underline-space" id="altura_lateral">${data.altura_lateral ?? ''}</span>
                                                </div>
                                            </td>
                                            <td style="width:33.33%;"></span>
                                            </td>
                                            <td style="width:33.33%;">
                                                <div class="form-row">
                                                    <span class="label">Comprimento do vão: </span>
                                                    <span class="underline-space" id="comprimento_vao">${data.comprimento_vao ?? ''}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>`;
    addContentTable(tr);
    tr = '';
}

function addCondideracaorIniciais(data) {
    if (data.descreva_consideracaoes_iniciais) {
        let tr = `<tr class="page-report-content">
        <td class="pdt-10 plr-20">
            <span class="titulo-atividade">Considerações Iniciais</span>
            <table width="100%" class="border-rounded" cellpadding="0" cellspacing="0">
                <tbody class="border-none">
                    <tr class="border-none">
                        <td class="border-none" width="100%" align="left">
                            <table width="100%" class=" m-t-0 m-b-0">
                                <tr>
                                    <td style="width:100%;min-height: 40px;">
                                        <span id="largura" style="width: 100%; display: block;">${data.descreva_consideracaoes_iniciais ?? ''}</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>
        </td>
    </tr>`;
        addContentTable(tr);
        tr = '';
    }

}

function addFotoPadrao(data) {
    let totalFotos = data.fotos.length;
    indexFotos = 0;
    if (totalFotos > 0) {
        _tr = '';
        _tds = '';
        data.fotos.forEach(foto => {
            indexFotos++;
            _tds += `<td align="center" style="width:50%;"><img src="${foto}" width="95%" height="auto"></td>`;
            if (indexFotos % 2 == 0 || indexFotos >= totalFotos) {
                _tr += `<tr>${_tds}</tr>`;
                _tds = '';
            }
        });
        tr += `
            <tr class="page-report-content">
                <td class="pdt-10 plr-20 fotopadrao">
                    <span class="titulo-atividade">Foto Padrão</span>
                    <table width="100%" class="fotopadrao">
                        <tbody>
                            ${_tr}
                        </tbody>
                    </table>
                </td>
            </tr>`;
        _tr = '';
        addContentTable(tr);
        tr = '';

    }
}
function esperarImagens(container) {
    const imgs = container.querySelectorAll('img');

    return Promise.all(
        [...imgs].map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = img.onerror = resolve;
            });
        })
    );
}

async function formataA4() {
    let headerContentHTML = getHeader();
    let footerContentHTML = getFooter();

    const origem = document.getElementById('content-page');
    const destino = document.body;

    const alturaA4 = 1000; // 26.7cm em pixels (ajustado para conteúdo)
    const margemHeader = 105; // reserva header + footer
    const margemFooter = 45; // reserva header + footer
    const alturaUtil = alturaA4 - (margemHeader + margemFooter);

    await esperarImagens(origem);

    const elementos = Array.from(origem.children);

    let paginas = [];

    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.top = '0';
    temp.style.left = '0';
    // temp.style.width = '210mm';      // 👈 FUNDAMENTAL
    temp.style.boxSizing = 'border-box';
    temp.style.padding = '20mm';
    temp.style.overflow = 'hidden';
    temp.style.height = alturaUtil + 'px';
    // temp.style.visibility = 'hidden';
    temp.style.width = origem.offsetWidth + 'px';

    document.body.appendChild(temp);



    let paginaAtual = [];
    let numeroPagina = 1;
    let safety = 0;
    const MAX = 300;

    while (elementos.length > 0) {
        if (++safety > MAX) {
            console.error('Loop interrompido por segurança');
            break;
        }
        const el = elementos.shift(); // REMOVE da fila → progresso garantido
        temp.appendChild(el.cloneNode(true));

        if (temp.scrollHeight > temp.clientHeight) {
            // remove o último que estourou
            temp.removeChild(temp.lastElementChild);

            // salva página cheia
            paginas.push(criarPagina(numeroPagina++, headerContentHTML, temp.innerHTML, footerContentHTML));

            // limpa e começa nova página
            temp.innerHTML = '';
            temp.appendChild(el.cloneNode(true));
        }
    }

    // última página
    if (temp.innerHTML.trim()) {
        paginas.push(criarPagina(numeroPagina, headerContentHTML, temp.innerHTML, footerContentHTML));
    }

    document.body.removeChild(temp);

    document.getElementById('page-content-page').remove();
    // renderiza Body
    destino.innerHTML += paginas.join('');
    // document.body.innerHTML += paginas.join('');

    // origem Remove
    /* 
    
    */
    // document.getElementById('content-page')
    // origem.remove();
    paginas = undefined;
}
function criarPagina(numeropagina, headerContentHTML, conteudoHTML, footerContentHTML) {
    return `
        <div class="pagebreak-before">
            <div class="page" >
                <table border=0 class="page-report-A4" id="page-${numeropagina}" width="100%">
                    <thead class="page-header" >${headerContentHTML}</thead>
                    <tbody class="page-content" >${conteudoHTML}</tbody>
                    <tfoot class="page-footer" >${footerContentHTML}</tfoot>
                </table>
            </div>
        </div>`;
}
