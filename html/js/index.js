let ArrayFotos = [];
async function getdata(task) {
    loading();
    if (task == undefined || task == '') {
        setNoData('', '<br>Por favor, informe o numero do pedido');
        return;
    }
    var url = `https://trlvvv52244il555u3yfuqampe0lulvd.lambda-url.us-east-1.on.aws/?pedido=${task}`;
    $.ajax({
        url: url,
        type: 'GET',
        crossDomain: true,
        contentType: 'application/json',
        success: function (response) {
            if (response.error || response.cabecalho == {} || response.cabecalho.vendedor == undefined) {
                setNoData(task, 'falha ao carregar pedido, verifique o numero e tente novamente');
            }

            setData(response);
        },
        error: function (jqXHR, textStatus, errorThrown) {
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
    showLoader();
    // const spinner = document.getElementById('loading-spinner');
    // spinner.style.display = spinner.style.display == 'flex' ? 'none' : 'flex';
}

function setNoData(task, message) {
    addContentMain(`
    <div id="loading-spinner-2">
        <div>
            <img src="https://avioeste.com.br/files/1466737/24db8bc7a776d5e833638f581f3facb5" width="250px">
            <br>
            <br>
        </div>
        <div class="error-message"><p>Pedido :${task} não encontrado </p><p>${message ? message : ''}</p></div>
    </div>`);
    hideLoader();
}
async function setData(data) {
    document.title += ` - Pedido ${data.pedido}`;
    addCabecalho(data.pedido, data.cabecalho);
    addDadosCliente(data.dadosCliente);
    addParticipantes(data.participantes);
    addInformacoesPreliminares(data.informacoesPreliminares);
    addCondideracaorIniciais(data.informacoesPreliminares);
    await addSecao(data.secoes);
    await ajustaGaleria();
    await addAssinaturas(data.participantes);
    await addPrintPreview();
    hideLoader();
}
async function addPrintPreview() {
    const script = document.createElement("script");
    // script.src = 'https://unpkg.com/pagedjs/dist/paged.polyfill.js';
    script.src = 'js/paged.polyfill.js';
    script.defer = true;
    script.setAttribute("data-pagedjs", "true");
    document.body.appendChild(script);
}
async function ajustaGaleria() {
    let divfotos = document.getElementById('galeria');
    addContentMain(divfotos.innerHTML);
    divfotos.remove();
}
function getHeader() {
    let header = `
    <header class="page-report-head print-header">
        <div class="border-rounded d-flex">
            <div class="fb-600 fs-20" style="width:70%">CHECK LIST<BR><span class="fb-800 fs-20">ENTREGA TÉCNICA</span></div>
            <div class="text-right" style="width:30%" ><img class="logo" src="img/logo.png"></div>
        </div>
    </div>`;
    return header;
}

function getFooter() {

    return `
    <footer class="page-report-content pdt-10 pdb-10 plr-20 print-footer">
        <table width="100%" class="border-rounded" cellpadding="0" cellspacing="0">
            <tbody class="border-none">
                <tr class="border-none">
                    <td width="50%" align="left" class="text-left fb-600 fs-14" >(49) 3664-8000</td>
                    <td>ROD. BR KM 102,3 - LINHA HUMAITÁ -
                            INDUSTRIAL<br>CEP 89890-000 Cunha Porã / SC</td>
                </tr>
            </tbody>
        </table>
    </footer>`;
}

async function addAssinaturas(data) {
    let _tds = '';
    let tr = '';

    for (let index = 1; index <= data.length; index++) {
        let participante = data[index - 1];
        _tds += `
        <td align="center">
            <img src="${participante.Assinatura}" class="fotopadraomax" onclick="window.open('${participante.Assinatura}', '_blank');" >
            <br><span class="label">Nome: ${participante.Nome} </span>
            <br><span class="label">Empresa: ${participante.Empresa} </span>
        </td>`;
        if (index % 2 == 0 || index >= data.length) {
            tr += `
            <div class="page-report-content pdt-10 plr-20 fotopadrao">
                    <span class="titulo-atividade">Assinaturas</span>
                    <table width="100%" class="fotopadrao">
                        <tbody>
                            <tr>${_tds}</tr>
                        </tbody>
                    </table>
            </div>`;
            _tds = '';
        }
    }
    if (_tds) {
        tr += `<div class="page-report-content pdt-10 plr-20 fotopadrao">
                    <span class="titulo-atividade">Assinaturas</span>
                    <table width="100%" class="fotopadrao">
                        <tbody>
                            <tr>${_tds}</tr>
                        </tbody>
                    </table>
                </div>`;
        _tds = '';
    }
    if (tr) {
        await addContentMain(tr);
        tr = '';
    }

}
let qtdfotosGaleria = 0;
let divFoto = '';
let trFotos = 0;

function addFoto(foto, ultimafoto = false, origem) {
    if (foto == undefined || foto == '') {
        return;
    }
    qtdfotosGaleria++;
    if (trFotos == 2 && divFoto != '') {
        let galeria = document.getElementById('galeria');
        let innerHTML = `
                <div  pdt-10 plr-20 fotopadrao" >
                    <table width="100%" class="fotopadrao">
                        <tbody>
                            <tr class="page-report-content">${divFoto}</tr>
                        </tbody>
                    </table>
                </div>`;
        // addContentMain(innerHTML);
        galeria.innerHTML += innerHTML;
        divFoto = '';
        trFotos = 0;
    }
    trFotos++;
    divFoto += `
            <td align="center" class="td-img">
                <a href="${foto}" class="item-foto">
                    <img src="${foto}" class="fotopadraomax" />
                </a>
            </td>`;
    if (trFotos == 2 || ultimafoto == true) {
        let galeria = document.getElementById('galeria');
        let innerHTML = `
                <div class="pdt-10 plr-20">
                    <table width="100%" class="border-rounded-img">
                        <tbody>
                            <tr class="page-report-content">${divFoto}</tr>
                        </tbody>
                    </table>
                </div>`;
        // addContentMain(innerHTML);
        galeria.innerHTML += innerHTML;
        divFoto = '';
        trFotos = 0;
    }
}
function addSecao(secoes) {
    let secao = '';
    let fotos = '';
    let itemsecao = 0;
    let body = document.getElementById('body');
    for (const chave in secoes) {
        itemsecao++;
        const secao = secoes[chave];
        let total = secao.itens.length;
        _secao = '';
        index = 0;
        _tr = '';
        _tds = '';
        _tr_tds = [];
        newLine = false;
        linha = 0;
        linhaTamanho = 0;
        let linhaAntes = 0;
        let tamanhoArrayAntes = 0;
        let limitChar = 46;
        secao.itens.forEach(item => {
            index++;
            item.tamanho = item.descricao.length + item.valor.length + 2;
            if (!(linha in _tr_tds)) {
                _tr_tds[linha] = [];
            }
            if (item.tamanho >= limitChar) {
                linhaAntes = linha;
                tamanhoArrayAntes = _tr_tds[linha].length;
                if (tamanhoArrayAntes >= 1) {
                    linhaAnterior = linha;
                    linha++; _tr_tds[linha] = [];
                    linhaTamanho = 0;
                }
            }
            if (_tr_tds[linha].length == 2) {
                linha++;
                _tr_tds[linha] = [];
                linhaTamanho = 0;
            }
            linhaTamanho += item.tamanho;
            _tr_tds[linha].push({ item: item });
            if (_tr_tds[linha].length == 2 || item.tamanho >= limitChar) {
                linha++;
                _tr_tds[linha] = [];
                linhaTamanho = 0;
            }
        });
        _tr_tds.forEach(linha => {
            _tds = '';
            per = 100 / linha.length;
            colspan = linha.length == 1 ? 3 : 1;
            linha.forEach(td => {
                let item = td.item;
                _tds += `
                <td class="secao-td" colspan="${colspan}" data-size="${item.tamanho}" style="width:${per}%">
                    <div class="form-row">
                        <span class="label">${item.descricao}: </span>
                        <span class="underline-space" id="${item.campo}">${item.valor}</span>
                    </div>
                </td>`;
            });
            _tr += `<tr class="secao-tr border-none page-report-content" >${_tds}</tr>`;
        });

        //Seção
        if (_tr) {
            _secao += `
            <div class="secao-div page-report-content pdt-10 plr-20">
                <span class="secao-titulo titulo-atividade">${secao.descricao}</span>
                <table width="100%" class="secao-table border-rounded" cellpadding="0" cellspacing="0">
                    <tbody class="secao-body border-none">
                        ${_tr}
                    </tbody>
                </table>
            </div>`;
        }

        //Observações
        if (secao.observacao) {
            _secao += `
            <div class="page-report-content pdt-10 plr-20">
                <div class="secao-titulo">Observações</div>
                  <div class="secao-bloco border-rounded">
                    <div class="secao-linha">${secao.observacao}
                    </div>
                </div>
            </div>`;
            /* 
            _secao += `<div class="page-report-content pdt-10 plr-20">
                    <span class="secao-titulo titulo-atividade">Observações</span>
                    <table width="100%" class="secao-table border-rounded" cellpadding="0" cellspacing="0">
                        <tbody class="secao-body border-none">
                            <tr class="secao-tr border-none page-report-content">
                               <td style="width:100%;min-height: 40px;">
                                    <span id="largura" style="width: 100%; display: block;">${secao.observacao}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>`;
            */
        }
        let totalfotossecao = 0;
        secao.fotos.forEach(async (foto) => {

            totalfotossecao++;
            let ultimafoto = (itemsecao == total && secao.fotos.length == totalfotossecao);
            addFoto(foto, ultimafoto, secao.descricao);
        });

        if (_secao) {
            addContentMain(_secao);
            _secao = '';
        }
    }
}

function addContentTable(html) {

    let table = document.getElementById('content-page');
    table.innerHTML += html;
    // table.insertAdjacentHTML('beforeend', html);
    // table.innerHTML(html);
}
function addContentBody(html) {
    let body = document.body;
    body.innerHTML += html;
}


function addContentMain(html) {
    let pages = document.getElementById('main');
    pages.innerHTML += html;
}

function addCabecalho(pedido, data) {

    let cabecalho = `
    <div class="page-report-content pdt-10 plr-20">
        <label class="titulo-atividade" for="cabecalho">Cabeçalho</label>
        <div id="cabecalho" class="border-rounded" >
            <p class="m-t-0 m-b-0">
                <label>Data de execução: </label> <span id="dataexec">${data.data} ${data.hora}</span><br>
                <label>Número: </label> <span id="pedido">${pedido}</span><br>
                <label>Vendedor: </label><span id="vendedor">${data.vendedor}</span><br>
                <label>Categoria de Vendas: </label> <span id="categoriaVendas">${data.categoriaVendas}</span><br>
                <label>Integradora: </label> <span id="integradora">${data.integradora}</span><br>
                <label>Projeto: </label> <span id="projeto">${data.projeto}</span>
            </p>
        </div>
    </div>`;
    addContentMain(cabecalho);
    cabecalho = '';
}

function addDadosCliente(data) {
    //Dados do Cliente
    tr = `
        <div class="page-report-content pdt-10 plr-20">
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
        </div>
    `;
    addContentMain(tr);
    tr = '';
}

function addParticipantes(data) {
    //Participantes
    tr = `
        <div class="page-report-content pdt-10 plr-20">
            <span class="titulo-atividade">Participantes</span>
            <table width="100%" class="border-rounded" cellpadding="0" cellspacing="0">
                <tbody class="border-none">`;

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
    tr += `</tbody></table></div>`;
    addContentMain(tr);
    tr = '';
}

function addInformacoesPreliminares(data) {
    tr = `<div class="page-report-content pdt-10 plr-20">
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
                </div>`;
    addContentMain(tr);
    tr = '';
    let qtdfoto = 0;
    let totalfotosPre = data.fotos.length;
    data.fotos.forEach(async (foto) => {
        qtdfoto++;
        let utimafoto = (totalfotosPre == qtdfoto);
        addFoto(foto, utimafoto, 'preliminares');
    });
}

function addCondideracaorIniciais(data) {
    if (data.descreva_consideracaoes_iniciais) {
        let tr = `
        <div class="page-report-content pdt-10 plr-20">
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
        </div>`;
        addContentMain(tr);
        tr = '';
    }

}
async function getMeta(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = function () {
            resolve({
                w: this.width,
                h: this.height
            });
        };

        img.onerror = reject;

        img.src = url;
    });
}
async function addGaleriaFotoPadrao(data) {
    let totalFotos = data.length;
    indexFotos = 0;
    if (totalFotos > 0) {
        _tr = '';
        _tds = '';
        qtd = 0;
        let div = '';
        await data.forEach(async (foto) => {
            indexFotos++;
            await getMeta(foto).then(end => {
                qtd++;

                td = `
                <div class="d-flex">
                    <a href="${foto}" target="_blank" rel="noopener">
                        <img class="fotopadraomax" src="${foto}" data-size="w:${end.w},h:${end.h},qtd:${qtd}">
                    </a>
                </div>`;
                if (end.w < end.h) {
                    if (qtd == 2 || indexFotos >= totalFotos) {
                        _tds += td;
                        div = `<div class="page-report-content">${_tds}</div>`;
                        addContentMain(div);
                        div = '';
                        _tds = '';
                        qtd = 0;
                    } else {
                        _tds += td;
                    }
                } else {
                    if (_tds) {
                        div = `<div class="page-report-content">${_tds}</div>`;
                        addContentMain(div);
                        div = '';
                        _tds = '';
                        qtd = 0;
                    }
                    div = `<div class="page-report-content">${td}</div>`;
                    addContentMain(div);
                    div = '';
                    _tds = '';
                    qtd = 0;
                }
            });
        });
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
            _tds += `<td align="center" style="width:50%;"><img onclick="window.open('${foto}', '_blank');" class="fotopadraomax" src="${foto}"></td>`;
            if (indexFotos % 2 == 0 || indexFotos >= totalFotos) {
                tr += `
                    <tr class="page-report-content">
                        <td class="pdt-10 plr-20 fotopadrao">
                            <span class="titulo-atividade">Foto Padrão</span>
                            <table width="100%" class="fotopadrao">
                                <tbody>
                                    ${_tds}
                                </tbody>
                            </table>
                        </td>
                    </tr>`;
                _tds = '';
            }
        });
        if (_tds) {
            tr += `
                    <tr class="page-report-content">
                        <td class="pdt-10 plr-20 fotopadrao">
                            <span class="titulo-atividade">Foto Padrão</span>
                            <table width="100%" class="fotopadrao">
                                <tbody>
                                    ${_tds}
                                </tbody>
                            </table>
                        </td>
                    </tr>`;
            _tds = '';
        }
        addContentTable(tr);
        tr = '';

    }
}
async function esperarImagens() {
    return await Promise.all(
        Array.from(document.images).filter(img => !img.complete).map(
            img => new Promise(resolve => {
                img.onload = img.onerror = resolve;
            })
        )
    );
}

async function formataA4() {
    let headerContentHTML = getHeader();
    let footerContentHTML = getFooter();

    // const origem = document.getElementById('content-page');
    const origem = document.getElementById('pages');
    const destino = document.body;

    const alturaA4 = 1000; // 26.7cm em pixels (ajustado para conteúdo)
    const margemHeader = 105; // reserva header + footer
    // const margemFooter = 60; // reserva header + footer
    const margemFooter = 0; // reserva header + footer
    const alturaUtil = alturaA4 - (margemHeader + margemFooter);
    const alturaUtilmm = 243;

    await esperarImagens();

    const elementos = Array.from(origem.children);

    let paginas = [];

    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.top = '0';
    temp.style.left = '0';
    temp.style.overflow = 'hidden';
    temp.style.maxHeight = alturaUtil + 'px';
    temp.style.width = origem.offsetWidth + 'px';

    document.body.appendChild(temp);

    let numeroPagina = 0;
    let safety = 0;
    const MAX = 300;
    while (elementos.length > 0) {
        if (++safety > MAX) {
            break;
        }
        const el = elementos.shift(); // REMOVE da fila → progresso garantido
        temp.appendChild(el.cloneNode(true));
        let scrollHeightmm = (temp.scrollHeight * 25.4) / 96;
        if (scrollHeightmm > alturaUtilmm) {
            let tamanhoAntesRemover = temp.scrollHeight;
            temp.removeChild(temp.lastElementChild);
            scrollHeightmm = (temp.scrollHeight * 25.4) / 96;
            let sobra = (alturaUtilmm - scrollHeightmm);
            numeroPagina++;
            paginas.push(criarPagina(numeroPagina, headerContentHTML, temp.innerHTML, footerContentHTML));

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

    document.getElementById('pages').remove();
    // renderiza Body
    destino.innerHTML += paginas.join('');
    let loadHtml = document.getElementById('body');
    // await esperarImagens();
    paginas = undefined;
}
function criarPagina(numeropagina, headerContentHTML, conteudoHTML, footerContentHTML) {
    return `
        <div class="page" id="page-${numeropagina}">
            <div class="page-inner">
                <header><table width="100%">${headerContentHTML}</table></header>
                <main class="content" ><table  width="100%" >${conteudoHTML}</table></main>    
                <footer><table width="100%">${footerContentHTML}</table></footer>
            </div>    
        </div>`;
}

let morphInterval = null;
let index = 0;
function showLoader() {
    const loader = document.getElementById('loading-spinner-2');
    const icons = loader.querySelectorAll('.icon-loader');

    loader.classList.remove('hide');
    loader.style.display = 'flex';

    if (morphInterval) return;

    morphInterval = setInterval(() => {
        item = icons[index];
        if (item) { item.classList.remove('active'); }
        index = (index + 1) % icons.length;
        item = icons[index];
        if (item) { item.classList.add('active'); }
    }, 1000);
}

function showStylePage(show) {
    const pages = document.querySelectorAll('.pagedjs_pagebox');
    if (show) {
        pages.forEach(page => {
            page.classList.add('previewstyleage');
        });
    } else {
        pages.forEach(page => {
            page.classList.remove('previewstyleage');
        });
    }
}
function showPrintButton(show) {
    const print = document.getElementById('btprint');
    if (print) { print.remove(); }
    if (show == true) {
        const print = document.createElement("div");
        print.id = 'btprint';
        print.classList.add('navbar');
        print.innerHTML = '<a href="javascript:window.print()" class="active">IMPRIMIR</a>';
        document.body.appendChild(print);
    }
}
function hideLoader() {
    const loader = document.getElementById('loading-spinner-2');
    loader.classList.add('hide');
    setTimeout(() => {
        loader.style.display = 'none';
        showStylePage(true);
        showPrintButton(true);
        clearInterval(morphInterval);
        morphInterval = null;
    }, 400);
}